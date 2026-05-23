/**
 * AntharikshAI - Syllabus Validator
 * Simplified validation logic
 */

// Common topics by subject
const COMMON_TOPICS = {
    'Physics': ['Motion', 'Force', 'Energy', 'Waves', 'Light', 'Electricity', 'Magnetism'],
    'Chemistry': ['Atoms', 'Molecules', 'Elements', 'Compounds', 'Reactions', 'Acids', 'Bases'],
    'Biology': ['Cells', 'Tissues', 'Organs', 'Systems', 'Plants', 'Animals', 'Ecology'],
    'Mathematics': ['Numbers', 'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Experiments', 'Scientific Method']
};

/**
 * Quick validation of mindmap against syllabus
 */
export const quickValidate = (mindmapCode, userData) => {
    const report = {
        isValid: false,
        coverage: 0,
        foundTopics: [],
        missingTopics: [],
        suggestions: [],
        details: []
    };

    if (!mindmapCode) {
        report.suggestions.push('No mindmap code provided');
        return report;
    }

    const { board, classLevel, subject, chapter } = userData || {};
    
    // Extract topics from mindmap
    const topicMatches = mindmapCode.match(/\(([^)]+)\)/g) || [];
    const subpointMatches = mindmapCode.match(/\[([^\]]+)\]/g) || [];
    
    const foundItems = [...topicMatches, ...subpointMatches].map(item => 
        item.replace(/[()\[\]]/g, '').trim()
    );

    report.foundTopics = foundItems;

    // Check against common topics
    const relevantTopics = COMMON_TOPICS[subject] || COMMON_TOPICS['Science'];
    const matchedTopics = relevantTopics.filter(topic => 
        foundItems.some(item => 
            item.toLowerCase().includes(topic.toLowerCase()) ||
            topic.toLowerCase().includes(item.toLowerCase())
        )
    );

    report.missingTopics = relevantTopics.filter(t => !matchedTopics.includes(t));
    
    // Calculate coverage
    report.coverage = relevantTopics.length > 0 
        ? Math.round((matchedTopics.length / relevantTopics.length) * 100)
        : 50;

    // Generate suggestions
    if (report.coverage < 70) {
        report.suggestions.push('Add more specific topics from your syllabus');
    }
    if (foundItems.length < 5) {
        report.suggestions.push('Expand with more sub-points for better coverage');
    }
    if (!mindmapCode.includes('root(((')) {
        report.suggestions.push('Ensure proper root node syntax: ((Chapter Name))');
    }

    report.isValid = report.coverage >= 50 && foundItems.length >= 3;
    
    return report;
};

/**
 * Get validation badge
 */
export const getValidationBadge = (report) => {
    if (!report) return null;
    
    if (report.coverage >= 80) {
        return { text: 'Excellent', icon: '✓', color: 'green' };
    } else if (report.coverage >= 60) {
        return { text: 'Good', icon: '✓', color: 'blue' };
    } else if (report.coverage >= 40) {
        return { text: 'Fair', icon: '⚠', color: 'yellow' };
    } else {
        return { text: 'Needs Work', icon: '✗', color: 'red' };
    }
};

export default {
    quickValidate,
    getValidationBadge
};
