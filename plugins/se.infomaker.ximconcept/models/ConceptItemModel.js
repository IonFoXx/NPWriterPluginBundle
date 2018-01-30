import XmlHandler from '@infomaker/xml-handler'
import { ConceptService } from 'writer'

class ConceptItemModel {

    get nameXpath() {
        return this.conceptItemConfig.common.name.xpath
    }

    get providerXpath() {
        return this.conceptItemConfig.common.provider.xpath
    }

    get pubStatusXpath() {
        return this.conceptItemConfig.common.status.xpath
    }

    get uiGroups() {
        return Array.isArray(this._uiGroups) ? this._uiGroups : []
    }

    set uiGroups(uiGroups) {
        this._uiGroups = Array.isArray(uiGroups) ? uiGroups : []
    }

    constructor(item, config, propertyMap) {
        this.item = item
        this.errors = []
        this.config = config
        this.propertyMap = propertyMap
    }

    async setUp() {
        if (!this.conceptXml) {
            try {
                this.conceptXml = await ConceptService.getConceptItemXml(this.item)
            } catch (error) {
                this.errors.push({
                    error: error.toString()
                })
            }
        }

        if (!this.conceptItemConfig) {
            try {
                this.conceptItemConfig = await ConceptService.fetchConceptItemConfigJson(this.item)

                if (!this.conceptItemConfig.details) {
                    throw new Error('Concept config json missing "details" part')
                }
            } catch (error) {
                this.errors.push({
                    error: error.toString()
                })
            }
        }

        if (!this.errors.length) {
            this.xmlHandler = new XmlHandler(this.conceptXml)
        }

        return this.uiGroups
    }

    async getUiGroups() {
        await this.setUp()
        this.uiGroups = this.errors.length ? this.errors : this.conceptItemConfig.details.map(group => {
            return {
                ...group,
                fields: group.fields.map((field, index) => {
                    const node = this.xmlHandler.getNode(field.xpath)
                    const nodeValue = this.xmlHandler.getNodeValue(node)

                    return {
                        ...field,
                        value: nodeValue,
                        node: node,
                        refId: `${group.title.replace(/ /g, "").trim()}-${index}`
                    }
                })
            }
        })

        // TODO: Un-stitch this
        if (!this.errors.length && this.item.create) {
            this.uiGroups[0].fields[0].value = this.item.searchedTerm
        }

        return this.uiGroups
    }

    async extractConceptArticleData(item) {
        await this.setUp()

        if (!this.errors.length) {
            if (this.config.appendDataToLink) {
                const instructions = this.config.instructions || this.conceptItemConfig.instructions || false

                if (instructions && instructions.articleData) {
                    item.articleData = instructions.articleData.reduce((accumulator, prop) => {
                        accumulator[prop.name] = this.xmlHandler.getNodeValue(this.xmlHandler.getNode(prop.xpath))
                        return accumulator
                    }, {})
                }
            }

            item.name = this.xmlHandler.getNodeValue(this.xmlHandler.getNode(this.nameXpath))
            item.type = item[this.propertyMap.ConceptImTypeFull]
        } else {
            item.errors = this.errors
        }

        return item
    }

    /**
     * Will save updated/created concept to OC and decorate
     * conceptItemObject with updated data
     *
     * @param {object} refs
     */
    async save(refs) {
        let item = this.item

        this.uiGroups.forEach(group => {
            group.fields.forEach(field => {
                this.xmlHandler.createNodes(field.xpath)

                if (!refs[field.refId]) {
                    console.info('Missing: ', field.type)
                }

                const value = refs[field.refId].val()
                const elementNode = this.xmlHandler.getSourceNode(field.xpath)
                const valueNode = this.xmlHandler.getNode(field.xpath)

                if (valueNode.singleNodeValue) {
                    this.xmlHandler.setNodeValue(valueNode, value)
                } else {
                    this.xmlHandler.setNodeValue(elementNode, value)
                }
            })
        })

        if (!item.uuid) {
            this.xmlHandler.createNodes(this.providerXpath)
            this.xmlHandler.createNodes(this.pubStatusXpath)

            this.xmlHandler.setNodeValue(this.xmlHandler.getNode(this.providerXpath), this.config.provider || 'writer')
            this.xmlHandler.setNodeValue(this.xmlHandler.getNode(this.pubStatusXpath), this.config.pubStatus || 'imext:draft')
        }

        const xmlString = new XMLSerializer().serializeToString(this.conceptXml.documentElement).trim().replace(/ xmlns=""/g, '')

        if (item.uuid) {
            await ConceptService.updateConceptItemXml(item.uuid, xmlString)
        } else {
            item.uuid = await ConceptService.createConceptItemXml(xmlString)
        }

        return await this.extractConceptArticleData(item)
    }
}

export default ConceptItemModel
