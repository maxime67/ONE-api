const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { param, query, validationResult } = require('express-validator');

// Middleware de validation des paramètres
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * @route   GET /api/vendors
 * @desc    Récupérer tous les vendeurs avec pagination
 * @access  Public
 */
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100'),
    query('sortBy').optional().isString().withMessage('Le champ de tri doit être une chaîne de caractères'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('L\'ordre de tri doit être "asc" ou "desc"')
], validate, vendorController.getAllVendors);

/**
 * @route   GET /api/vendors/:id
 * @desc    Récupérer un vendeur par son ID
 * @access  Public
 */
router.get('/:id', [
    param('id').isMongoId().withMessage('ID de vendeur invalide')
], validate, vendorController.getVendorById);

/**
 * @route   GET /api/vendors/name/:name
 * @desc    Récupérer un vendeur par son nom
 * @access  Public
 */
router.get('/name/:name', [
    param('name').isString().withMessage('Le nom doit être une chaîne de caractères')
], validate, vendorController.getVendorByName);

/**
 * @route   GET /api/vendors/search
 * @desc    Rechercher des vendeurs par texte
 * @access  Public
 */
router.get('/search', [
    query('q').isString().withMessage('Le terme de recherche doit être une chaîne de caractères'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, vendorController.searchVendors);

/**
 * @route   GET /api/vendors/:id/products
 * @desc    Récupérer les produits d'un vendeur
 * @access  Public
 */
router.get('/:id/products', [
    param('id').isMongoId().withMessage('ID de vendeur invalide'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, vendorController.getVendorProducts);

/**
 * @route   GET /api/vendors/stats
 * @desc    Récupérer les statistiques des vendeurs
 * @access  Public
 */
router.get('/stats/summary', vendorController.getVendorStats);

/**
 * @route   GET /api/vendors/:id/stats
 * @desc    Récupérer les statistiques des CVE pour un vendeur
 * @access  Public
 */
router.get('/:id/stats', [
    param('id').isMongoId().withMessage('ID de vendeur invalide')
], validate, vendorController.getVendorCVEStats);

module.exports = router;