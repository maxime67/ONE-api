const cveService = require('../services/cveService');

/**
 * Contrôleur pour les routes des CVE
 */
class CVEController {
    /**
     * Récupère tous les CVE avec pagination
     */
    async getAllCVEs(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const sortBy = req.query.sortBy || 'publishedDate';
            const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

            const result = await cveService.getAllCVEs(page, limit, sortBy, sortOrder);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère un CVE par son ID
     */
    async getCVEById(req, res, next) {
        try {
            const cveId = req.params.cveId;
            const cve = await cveService.getCVEById(cveId);

            if (!cve) {
                return res.status(404).json({
                    error: true,
                    message: `CVE avec l'ID ${cveId} non trouvé`
                });
            }

            res.json(cve);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les CVE avec un niveau de sévérité spécifique
     */
    async getCVEsBySeverity(req, res, next) {
        try {
            const severity = req.params.severity;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await cveService.getCVEsBySeverity(severity, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les CVE pour un produit spécifique
     */
    async getCVEsByProduct(req, res, next) {
        try {
            const productId = req.params.productId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await cveService.getCVEsByProduct(productId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les CVE pour un vendeur spécifique
     */
    async getCVEsByVendor(req, res, next) {
        try {
            const vendorId = req.params.vendorId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await cveService.getCVEsByVendor(vendorId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recherche les CVE par texte
     */
    async searchCVEs(req, res, next) {
        try {
            const searchTerm = req.query.q;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (!searchTerm) {
                return res.status(400).json({
                    error: true,
                    message: 'Le paramètre de recherche q est requis'
                });
            }

            const result = await cveService.searchCVEs(searchTerm, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les statistiques des CVE
     */
    async getCVEStats(req, res, next) {
        try {
            const stats = await cveService.getCVEStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les statistiques temporelles des CVE
     */
    async getCVETimeline(req, res, next) {
        try {
            const period = req.query.period || 'month';
            const limit = parseInt(req.query.limit) || 12;

            const timeline = await cveService.getCVETimeline(period, limit);
            res.json(timeline);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CVEController();