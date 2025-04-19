const express = require('express');
const router = express.Router();
const cveController = require('../controllers/cveController');
const { param, query, validationResult } = require('express-validator');
const {authenticateToken} = require("../middlewares/authMiddleware");

// Middleware de validation des paramètres
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * @route   GET /api/cves
 * @desc    Récupérer toutes les CVE avec pagination
 * @access  Public
 */
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100'),
    query('sortBy').optional().isString().withMessage('Le champ de tri doit être une chaîne de caractères'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('L\'ordre de tri doit être "asc" ou "desc"')
], validate, cveController.getAllCVEs);

/**
 * @route   GET /api/cves/CVE-2025-1036
 * @desc    Récupérer la CVE avec l'identifiant fournis
 * @access  Public
 */
router.get('/:cveId', validate, cveController.getCVEById);

/**
 * @route   GET /api/cves/search
 * @desc    Rechercher des CVE par texte
 * @access  Public
 */
router.get('/search', [
    query('q').isString().withMessage('Le terme de recherche doit être une chaîne de caractères'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, cveController.searchCVEs);

/**
 * @route   GET /api/cves/stats/summary
 * @desc    Récupérer les statistiques des CVE
 * @access  Public
 */
router.get('/stats/summary', cveController.getCVEStats);

/**
 * @route   GET /api/cves/stats/timeline
 * @desc    Récupérer les statistiques temporelles des CVE
 * @access  Public
 */
router.get('/stats/timeline', [
    query('period').optional().isIn(['day', 'week', 'month']).withMessage('La période doit être "day", "week" ou "month"'),
    query('limit').optional().isInt({ min: 1, max: 60 }).withMessage('La limite doit être un entier entre 1 et 60')
], validate, cveController.getCVETimeline);

/**
 * @route   GET /api/cves/severity/:severity
 * @desc    Récupérer les CVE par niveau de sévérité
 * @access  Public
 */
router.get('/severity/:severity', [
    param('severity').isString().withMessage('La sévérité doit être une chaîne de caractères'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, cveController.getCVEsBySeverity);

/**
 * @route   GET /api/cves/product/:productId
 * @desc    Récupérer les CVE pour un produit spécifique
 * @access  Public
 */
router.get('/product/:productId', [
    param('productId').isMongoId().withMessage('ID de produit invalide'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, cveController.getCVEsByProduct);

/**
 * @route   GET /api/cves/vendor/:vendorId
 * @desc    Récupérer les CVE pour un vendeur spécifique
 * @access  Public
 */
router.get('/vendor/:vendorId', [
    param('vendorId').isMongoId().withMessage('ID de vendeur invalide'),
    query('page').optional().isInt({ min: 1 }).withMessage('La page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
], validate, cveController.getCVEsByVendor);

/**
 * @route   GET /api/cves/stats/summary
 * @desc    Récupérer les statistiques des CVE
 * @access  Public
 */
router.get('/stats/summary', cveController.getCVEStats);

/**
 * @route   GET /api/cves/stats/timeline
 * @desc    Récupérer les statistiques temporelles des CVE
 * @access  Public
 */
router.get('/stats/timeline', [
    query('period').optional().isIn(['day', 'week', 'month']).withMessage('La période doit être "day", "week" ou "month"'),
    query('limit').optional().isInt({ min: 1, max: 60 }).withMessage('La limite doit être un entier entre 1 et 60')
], validate, cveController.getCVETimeline);

module.exports = router;