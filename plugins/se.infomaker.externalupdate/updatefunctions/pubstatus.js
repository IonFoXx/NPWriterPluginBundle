class PubStatus {

    constructor(documentApi) {
        this.documentApi = documentApi
    }

    getKey() {
        return "pubStatus"
    }

    set(data) {
        // TODO Validate input
        this.documentApi.setPubStatus({
            change: data.value,
            eventType: "external:update"
        })
    }
}

export {PubStatus}

