import app from './app.js';
const stack = app._router?.stack || [];
for (const layer of stack) {
    if (layer.route) {
        console.log('route', layer.route.path, Object.keys(layer.route.methods));
    } else if (layer.name === 'router' && layer.handle?.stack) {
        console.log('router', layer.regexp.toString());
        for (const child of layer.handle.stack) {
            if (child.route) {
                console.log(' child', child.route.path, Object.keys(child.route.methods));
            }
        }
    }
}
