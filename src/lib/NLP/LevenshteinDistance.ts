function calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Initialize the matrix
    for (let i = 0; i <= str1.length; i++) {
        matrix[ i ] = [ i ];
    }

    for (let j = 0; j <= str2.length; j++) {
        matrix[ 0 ][ j ] = j;
    }

    // Fill in the matrix
    for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
            const cost = str1[ i - 1 ] === str2[ j - 1 ] ? 0 : 1;
            matrix[ i ][ j ] = Math.min(
                matrix[ i - 1 ][ j ] + 1, // Deletion
                matrix[ i ][ j - 1 ] + 1, // Insertion
                matrix[ i - 1 ][ j - 1 ] + cost // Substitution
            );
        }
    }

    // The final value in the matrix represents the Levenshtein distance
    return matrix[ str1.length ][ str2.length ];
}

export default calculateLevenshteinDistance