import {Component, FontAwesomeIcon} from 'substance'

class PaginationComponent extends Component {

    render($$) {

        return $$('div').addClass('pagination')
            .append(
                this._renderLeftControl($$),
                $$('div').addClass('numbered-pages').append(
                    ...this._renderPageControls($$)
                ),
                this._renderRightControl($$)
            )
    }

    get currentPageIndex() {
        return this.props.currentPage - 1
    }

    get pageNumberArray() {

        const allPages = [...Array(this.props.totalPages).keys()].map(index => index + 1)
        const leftPages = allPages.slice(0, this.currentPageIndex)
        const rightPages = allPages.slice(this.currentPageIndex)

        return [...this._truncatePageNumbers(leftPages, -1), ...this._truncatePageNumbers(rightPages)]
    }

    /**
     * @param {[Number]} pageNumbers
     * @param {Number} direction Left or Right indicated by -1 or 1 (Default 1)
     * @returns {[Number]}
     * @private
     */
    _truncatePageNumbers(pageNumbers, direction = 1) {
        let truncatedArray = []
        const arrayLength = pageNumbers.length
        if (arrayLength > 5) {

            if (direction === -1) {
                truncatedArray = [...pageNumbers.slice(0, 2), '...', ...pageNumbers.slice(Math.max(arrayLength - 3, 0))]
            } else {
                truncatedArray = [...pageNumbers.slice(0, 4), '...', ...pageNumbers.slice(arrayLength - 2)]
            }

            return truncatedArray
        } else {
            return pageNumbers
        }
    }

    /**
     * @param $$
     * @returns {[VirtualElement]}
     * @private
     */
    _renderPageControls($$) {

        return this.pageNumberArray.map((number) => {

            const pageControl = $$('span')
                .append(`${number}`)
                .on('click', () => {
                    this.props.onPageChange(number)
                })

            if (number === this.props.currentPage) {
                pageControl.addClass('active-page')
            }

            return pageControl
        })
    }

    _renderRightControl($$) {
        const control = $$('button').append(
            $$(FontAwesomeIcon, {icon: 'fa-angle-double-right'})
        ).on('click', () => {
            this.props.onPageChange(this.props.currentPage + 1)
        })

        if (this.props.currentPage >= this.props.totalPages) {
            control.attr('disabled', true)
        }

        return control
    }

    _renderLeftControl($$) {
        const control = $$('button').append(
            $$(FontAwesomeIcon, {icon: 'fa-angle-double-left'})
        ).on('click', () => {
            this.props.onPageChange(this.props.currentPage - 1)
        })

        if (this.currentPageIndex === 0) {
            control.attr('disabled', true)
        }

        return control
    }
}

export default PaginationComponent