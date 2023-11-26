/**
 * This file is just a singletons wrapper around node-cache.
 * this will help us to avoid using global variables.
 * and allow only one instance of the cache to be used and single source of truth.
 */


import NodeCache from "node-cache"

export default new NodeCache()
