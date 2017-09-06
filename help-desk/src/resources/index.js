export function configure(config) {
    config.globalResources([
        './value-converters/activity-type-to-route',
        './value-converters/date'
    ]);
}
