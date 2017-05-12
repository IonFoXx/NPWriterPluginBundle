import { Component } from 'substance'
const {api} = writer

/*
  Used in ImageDisplay
*/
class ImageCropper extends Component {
    constructor(...args) {
        super(...args)
    }

    getInitialState() {
        return {
            disableAutomaticCrop: this.props.disableAutomaticCrop === true ? true : false
        }
    }

    // Never rerender this component as the crop looses it
    shouldRerender(newProps, newState) {
        return false
    }

    didMount() {
        this.cropEditor = new IMSoftcrop.Editor( // eslint-disable-line
            'ximimage__softcrop',
            {
                autocrop: false,
                //detectWorkerUrl: false, // FIXME: Use 'node_modules/cropjs/dist/js/imcrop.worker.detect.js',
                //detectThreshold: 30,
                //detectStepSize: 3,
                debug: false
            }
        )

        let definedCrops = api.getConfigValue(this.props.parentId, 'crops', []),
            encodedSrc = encodeURIComponent(this.props.src)

        this.disableAutomaticCrop = this.props.disableAutomaticCrop

        this.cropEditor.addImage(
            '/api/resourceproxy?url=' + encodedSrc,
            () => {
                let selected = true
                for(var name in definedCrops) {
                    if (this.props.crops) {
                        this.addCrop(name, selected, definedCrops[name], this.props.crops)
                    }
                    else {
                        this.createCrop(name, selected, definedCrops[name])
                    }
                    selected = false
                }
            }
        )
    }

    createCrop(name, selected, definedCrop) {
        // If there are no defined crops, new crops should be usable by default
        const usable = this.props.crops.length === 0

        this.cropEditor.addSoftcrop(
            name,
            selected,
            definedCrop[0],
            definedCrop[1],
            null,
            null,
            usable
        )
    }

    // FIXME: Does not work with existing crops already on the image
    addCrop(name, selected, definedCrop, existingCrops) {
        var existingCrop = null
        for (var n = 0; n < existingCrops.length; n++) {
            if (existingCrops[n].name === name) {
                existingCrop = existingCrops[n]
                break
            }
        }

        if (!existingCrop) {
            this.createCrop(name, selected, definedCrop)
            return
        }

        let imageWidth = this.props.width
        let imageHeight = this.props.height
        let matches = this.props.src.match(/&w=([0-9]*)/)

        if (Array.isArray(matches) && matches.length === 2) {
            imageWidth = matches[1]
            imageHeight = Math.round((imageWidth / this.props.width) * this.props.height)
        }

        this.cropEditor.addSoftcrop(
            name,
            selected,
            Math.round(existingCrop.width * imageWidth),
            Math.round(existingCrop.height * imageHeight),
            Math.round(existingCrop.x * imageWidth),
            Math.round(existingCrop.y * imageHeight)
        )
    }

    render($$) {
        const Toggle = this.getComponent('toggle')

        return $$('div').append([
            $$('div')
                .attr('id', 'ximimage__softcrop')
                .addClass('sc-image-cropper')
                .ref('cropper'),
            $$('div').append(
                $$(Toggle, {
                    id: 'crop-toggle',
                    label: this.getLabel('Disable automatic crop in frontend'),
                    checked: this.state.disableAutomaticCrop,
                    onToggle: (checked) => {
                        this.extendState({
                            disableAutomaticCrop: checked
                        })
                    }
                })
            ).addClass('se-crop-options')
        ])
    }

    onClose(status) {
        if (status === "cancel") {
            return
        }

        let data = this.cropEditor.getSoftcropData(),
            crops = []

        data.crops.forEach( (crop) => {
            if (!crop.usable) {
                return
            }

            crops.push({
                name: crop.id,
                x: crop.x / data.width,
                y: crop.y / data.height,
                width: crop.width / data.width,
                height: crop.height / data.height
            })
        })

        this.props.callback({ crops: crops }, this.state.disableAutomaticCrop);
    }
}

export default ImageCropper
