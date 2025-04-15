const searchService = require('../services/searchService');

/**
 * Contrôleur pour les routes de recherche
 */
class SearchController {
    /**
     * Recherche globale sur tous les modèles
     */
    async globalSearch(req, res, next) {
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

            const results = await searchService.globalSearch(searchTerm, page, limit);
            res.json(results);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recherche avancée avec filtres multiples
     */
    async advancedSearch(req, res, next) {
        try {
            const filters = req.body;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (Object.keys(filters).length === 0) {
                return res.status(400).json({
                    error: true,
                    message: 'Au moins un filtre de recherche est requis'
                });
            }

            const results = await searchService.advancedSearch(filters, page, limit);
            res.json(results);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Suggère des termes pour l'autocomplétion
     */
    async getSuggestions(req, res, next) {
        try {
            const prefix = req.query.prefix;
            const type = req.query.type || 'all';
            const limit = parseInt(req.query.limit) || 10;

            if (!prefix) {
                return res.status(400).json({
                    error: true,
                    message: 'Le paramètre prefix est requis'
                });
            }

            const suggestions = await searchService.getSuggestions(prefix, type, limit);
            res.json(suggestions);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SearchController();