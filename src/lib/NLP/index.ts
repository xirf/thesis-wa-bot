import calculateLevenshteinDistance from "./LevenshteinDistance";


function getSimilarity(keyword: string, threshold: number = 0.25, dict: string[]): Similarity[] {


    let result: Similarity[] = []

    for (const item of dict) {

        const distance = calculateLevenshteinDistance(keyword.toLowerCase(), item.toLocaleLowerCase())
        const similarity = 1 - distance / Math.max(keyword.length, item.length)

        result.push({
            name: item,
            distance: similarity
        })
    }


    result = result.sort((a, b) => {
        return b.distance - a.distance
    }).filter(el => el.distance >= threshold)

    return (result)
}

export default getSimilarity