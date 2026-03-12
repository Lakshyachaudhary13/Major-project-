const express = require('express');
const router = express.Router();

module.exports = (supabase) => {

    // Get analytics data
    router.get('/complaints', async (req, res) => {
        try {
            const { dateRange = '30', category = 'all', status = 'all' } = req.query;

            let query = supabase.from('complaints').select('*');

            if (dateRange !== 'all') {
                const days = parseInt(dateRange);
                const date = new Date();
                date.setDate(date.getDate() - days);
                query = query.gte('timestamp', date.toISOString());
            }

            if (category !== 'all') {
                query = query.eq('category', category);
            }

            if (status !== 'all') {
                query = query.eq('status', status);
            }

            const { data: complaints, error } = await query;
            if (error) throw error;

            let total = 0;
            let resolved = 0;
            let pending = 0;
            let resolutionTimeSum = 0;

            for (const item of (complaints || [])) {
                total++;
                if (item.status === 'resolved') {
                    resolved++;
                    if (item.timestamp) {
                        const submitted = new Date(item.timestamp);
                        // Using resolvedAt if available, otherwise fallback to current time
                        const resolvedTime = item.resolvedAt ? new Date(item.resolvedAt) : new Date();
                        const diffInHours = (resolvedTime - submitted) / (1000 * 60 * 60);
                        resolutionTimeSum += diffInHours;
                    }
                } else if (item.status === 'pending') {
                    pending++;
                }
            }

            const avgResolutionTime = resolved > 0 ? (resolutionTimeSum / resolved) : 0;

            // Get chart data
            const chartData = await getChartData(supabase, dateRange, category, status);

            res.json({
                metrics: {
                    total,
                    resolved,
                    pending,
                    avgResolutionTime: Math.round(avgResolutionTime)
                },
                charts: chartData
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({ error: 'Failed to fetch analytics data' });
        }
    });

    // Get chart data
    async function getChartData(supabase, dateRange, category, status) {
        try {
            let query = supabase.from('complaints').select('*');

            if (dateRange !== 'all') {
                const days = parseInt(dateRange);
                const date = new Date();
                date.setDate(date.getDate() - days);
                query = query.gte('timestamp', date.toISOString());
            }

            let categoryFilterQuery = supabase.from('complaints').select('*');
            if (dateRange !== 'all') {
                const days = parseInt(dateRange);
                const date = new Date();
                date.setDate(date.getDate() - days);
                categoryFilterQuery = categoryFilterQuery.gte('timestamp', date.toISOString());
            }
            if (status !== 'all') {
                categoryFilterQuery = categoryFilterQuery.eq('status', status);
            }

            if (category !== 'all') {
                query = query.eq('category', category);
            }

            if (status !== 'all') {
                query = query.eq('status', status);
            }

            const { data: complaints, error } = await query;
            if (error) throw error;
            
            const { data: categoryComplaints, error: categoryError } = await categoryFilterQuery;
            if (categoryError) throw categoryError;

            // Trend query (always 30 days)
            let trendQuery = supabase.from('complaints').select('*');
            const trendDate = new Date();
            trendDate.setDate(trendDate.getDate() - 30);
            trendQuery = trendQuery.gte('timestamp', trendDate.toISOString());
            const { data: trendComplaints, error: trendError } = await trendQuery;
            if (trendError) throw trendError;
            
            // Status distribution
            const statusCounts = {};
            (complaints || []).forEach(c => {
               statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
            });
            const statusRows = Object.keys(statusCounts).map(s => ({ status: s, count: statusCounts[s] }));

            // Category distribution
            const categoryCounts = {};
            (categoryComplaints || []).forEach(c => {
               categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
            });
            const categoryRows = Object.keys(categoryCounts).map(c => ({ category: c, count: categoryCounts[c] }));

            // Trend data (last 30 days)
            const trendCounts = {};
            (trendComplaints || []).forEach(c => {
                if (c.timestamp) {
                    const date = c.timestamp.split('T')[0];
                    trendCounts[date] = (trendCounts[date] || 0) + 1;
                }
            });
            const trendRows = Object.keys(trendCounts).sort().map(d => ({ date: d, count: trendCounts[d] }));

            // Resolution time distribution
            const resolutionCounts = {
                '0-1 hours': 0,
                '1-24 hours': 0,
                '1-7 days': 0,
                '7+ days': 0
            };
            
            (complaints || []).filter(c => c.status === 'resolved').forEach(c => {
                if (c.timestamp) {
                    const submitted = new Date(c.timestamp);
                    const resolvedTime = c.resolvedAt ? new Date(c.resolvedAt) : new Date();
                    const diffInHours = (resolvedTime - submitted) / (1000 * 60 * 60);
                    
                    if (diffInHours <= 1) {
                        resolutionCounts['0-1 hours']++;
                    } else if (diffInHours <= 24) {
                        resolutionCounts['1-24 hours']++;
                    } else if (diffInHours <= 168) {
                        resolutionCounts['1-7 days']++;
                    } else {
                        resolutionCounts['7+ days']++;
                    }
                }
            });
            
            const resolutionRows = Object.keys(resolutionCounts).map(range => ({ timeRange: range, count: resolutionCounts[range] })).filter(r => r.count > 0);

            const chartData = {
                status: {
                    labels: statusRows.map(row => row.status.charAt(0).toUpperCase() + row.status.slice(1)),
                    data: statusRows.map(row => row.count)
                },
                category: {
                    labels: categoryRows.map(row => row.category.charAt(0).toUpperCase() + row.category.slice(1)),
                    data: categoryRows.map(row => row.count)
                },
                trend: {
                    labels: trendRows.map(row => new Date(row.date).toLocaleDateString()),
                    data: trendRows.map(row => row.count)
                },
                resolution: {
                    labels: resolutionRows.map(row => row.timeRange),
                    data: resolutionRows.map(row => row.count)
                }
            };

            return chartData;
        } catch (error) {
            console.error('Error getting chart data:', error);
            return {
                status: { labels: [], data: [] },
                category: { labels: [], data: [] },
                trend: { labels: [], data: [] },
                resolution: { labels: [], data: [] }
            };
        }
    }

    return router;
};
