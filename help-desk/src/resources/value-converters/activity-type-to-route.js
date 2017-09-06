export class ActivityTypeToRouteValueConverter {

    toView(value) {
        if (value == 'ticket') return 'thread'

        throw new Error(`Unknown ticket type: ${value}`)
    }
}