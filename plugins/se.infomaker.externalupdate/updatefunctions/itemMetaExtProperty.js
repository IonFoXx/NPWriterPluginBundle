import {event} from 'writer'
class ItemMetaExtProperty {

    constructor(documentApi) {
        this.documentApi = documentApi
    }

    getKey() {
        return "itemMetaExtProperty"
    }

    set(data) {
        this.documentApi.setItemMetaExtProperty({
            change: data.value,
            eventType: event.DOCUMENT_CHANGED_EXTERNAL
        })
    }

}

export {ItemMetaExtProperty}
