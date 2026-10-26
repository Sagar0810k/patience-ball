/** Every 10 levels form a world that ends in a boss. Worlds have a name and their own colours. */
export const WORLD_SIZE = 10;
const NAMES = ['Sunny Slopes', 'Crystal Caves', 'Neon Docks', 'Frost Peak', 'Magma Run', 'Star Forge'];
export const worldOf = (level: number) => Math.ceil(Math.max(1, level) / WORLD_SIZE);
export const worldName = (world: number) => NAMES[(world - 1) % NAMES.length] + (world > NAMES.length ? ` ${Math.ceil(world / NAMES.length)}` : '');
