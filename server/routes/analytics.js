const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // Get analytics data
    router.get('/complaints', async (req, res) => {
        try {
            const { dateRange = '30', category = 'all', status = 'all' } = req.query;

            // Build date filter
            let dateFilter = '';
            let params = [];
            
            if (dateRange !== 'all') {
                const days = parseInt(dateRange);
                const date = new Date();
                date.setDate(date.getDate() - days);
                dateFilter = `AND timestamp >= ?`;
                params.push(date.toISOString());
            }

            // Build category filter
            let categoryFilter = '';
            if (category !== 'all') {
                categoryFilter = `AND category = ?`;
                params.push(category);
            }

            // Build status filter
            let statusFilter = '';
            if (status !== 'all') {
                statusFilter = `AND status = ?`;
                params.push(status);
            }

            const query = `
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    AVG(CASE WHEN status = 'resolved' THEN
                        TIMESTAMPDIFF(HOUR, timestamp, NOW())
                    END) as avgResolutionTime
                FROM complaints
                WHERE 1=1 ${dateFilter} ${categoryFilter} ${statusFilter}
            `;

            const [metrics] = await db.execute(query, params);

            // Get chart data
            const chartData = await getChartData(db, dateRange, category, status);

            res.json({
                metrics: {
                    total: metrics[0]?.total || 0,
                    resolved: metrics[0]?.resolved || 0,
                    pending: metrics[0]?.pending || 0,
                    avgResolutionTime: Math.round(metrics[0]?.avgResolutionTime || 0)
                },
                charts: chartData
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({ error: 'Failed to fetch analytics data' });
        }
    });

    // Get chart data
    async function getChartData(db, dateRange, category, status) {
        try {
            // Build filters with proper date handling
            let dateFilter = '';
            let dateParams = [];
            
            if (dateRange !== 'all') {
                const days = parseInt(dateRange);
                const date = new Date();
                date.setDate(date.getDate() - days);
                dateFilter = `AND timestamp >= ?`;
                dateParams.push(date.toISOString());
            }

            let categoryFilter = '';
            let categoryParams = [];
            if (category !== 'all') {
                categoryFilter = `AND category = ?`;
                categoryParams.push(category);
            }

            let statusFilter = '';
            let statusParams = [];
            if (status !== 'all') {
                statusFilter = `AND status = ?`;
                statusParams.push(status);
            }

            // Status distribution
            const [statusRows] = await db.execute(
                `SELECT status, COUNT(*) as count
                 FROM complaints
                 WHERE 1=1 ${dateFilter} ${categoryFilter} ${statusFilter}
                 GROUP BY status`,
                [...dateParams, ...categoryParams, ...statusParams]
            );

            // Category distribution
            const [categoryRows] = await db.execute(
                `SELECT category, COUNT(*) as count
                 FROM complaints
                 WHERE 1=1 ${dateFilter} ${statusFilter}
                 GROUP BY category`,
                [...dateParams, ...statusParams]
            );

            // Trend data (last 30 days)
            const [trendRows] = await db.execute(
                `SELECT DATE(timestamp) as date, COUNT(*) as count
                 FROM complaints
                 WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                 GROUP BY DATE(timestamp)
                 ORDER BY date`
            );

            // Resolution time distribution
            const [resolutionRows] = await db.execute(
                `SELECT
                    CASE
                        WHEN TIMESTAMPDIFF(HOUR, timestamp, NOW()) <= 1 THEN '0-1 hours'
                        WHEN TIMESTAMPDIFF(HOUR, timestamp, NOW()) <= 24 THEN '1-24 hours'
                        WHEN TIMESTAMPDIFF(HOUR, timestamp, NOW()) <= 168 THEN '1-7 days'
                        ELSE '7+ days'
                    END as timeRange,
                    COUNT(*) as count
                 FROM complaints
                 WHERE status = 'resolved' ${dateFilter} ${categoryFilter}
                 GROUP BY timeRange`,
                [...dateParams, ...categoryParams]
            );

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
