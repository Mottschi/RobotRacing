
/**
 * 
 * @param {Array} arr Array of Elements
 * @returns any random Array Element
 */
export let getRandomArrayElement = function getRandomArrayElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
};