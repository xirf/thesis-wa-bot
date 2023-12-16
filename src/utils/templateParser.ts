export default (text: String, replacer: Record<string, any>): string => {
    // replace all {key} with replacer[key]
    return text.replace(/{(\w+)}/g, (match, key) => {
        if (replacer.hasOwnProperty(key)) return replacer[ key ];
        else return match;
    });
}