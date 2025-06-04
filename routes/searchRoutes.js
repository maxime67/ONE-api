const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { query, validationResult } = require('express-validator');

// Middleware de validation des paramètres
const validate = (req, res, next) => {
    // Fonction principale qui applique les tests définies dans les définitions de routes
    const errors = validationResult(req);
    // Rend une http 400 en cas de données invalide
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Next permet au code suivant de s'executer
    next();
};

/**
 * @route   GET /api/search
 * @desc    Recherche globale sur tous les modèles
 * @access  Public
 */
router.get('/', [
    query('q').isString().withMessage('Le terme de recherche doit être une chaîne de caractères'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, searchController.globalSearch);

/**
 * @route   POST /api/search/advanced
 * @desc    Recherche avancée avec filtres multiples
 * @access  Public
 */
router.post('/advanced', [
    // Vérification des données reçues
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
],
    // On utilise un middleware afin de faire valider nos paramètres reçus
    validate,
    // On appel notre controller et on utilise la méthode que l'on souhaite associer à notre route
    searchController.advancedSearch);



/**
 * @route   GET /api/search/suggestions
 * @desc    Suggérer des termes pour l'autocomplétion
 * @access  Public
 */
router.get('/suggestions', [
    query('prefix').isString().withMessage('Le préfixe doit être une chaîne de caractères'),
    query('type').optional().isIn(['all', 'cve', 'vendor', 'product']).withMessage('Le type doit être "all", "cve", "vendor" ou "product"'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('La limite doit être un entier entre 1 et 50')
], validate, searchController.getSuggestions);

module.exports = router;