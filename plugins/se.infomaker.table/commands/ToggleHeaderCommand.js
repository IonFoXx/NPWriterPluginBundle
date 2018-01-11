import { Command } from 'substance'
import { api } from 'writer'
import selectionIsInTable from '../util/selectionIsInTable'

class ToggleHeaderCommand extends Command {
    execute(params, context) {
        console.info('Trying ToggleHeaderCommand')
        if (params.commandState && !params.commandState.disabled) {
            console.info('ToggleHeaderCommand params:', params, 'context', context)
            const doc = context.editorSession.getDocument()
            const nodeId = params.selection.getNodeId()
            const node = doc.get(nodeId)

            if (!node) { return }

            let table = null
            if (node.type === 'table') {
                table = node
            } else if (node.type === 'table-cell') {
                table = node.table
            }

            if (!table) { return }

            console.info('Executing header command on node', table)
            this._executeBoldCommandOnArea(table)
            // table.toggleHeader()
        }
    }

    /**
     * Our command is enabled on table nodes and inside table cells.
     */
    getCommandState(params) {
        return {
            disabled: !selectionIsInTable(params.selection)
        }
    }

    _executeBoldCommandOnArea(table) {
        const es = api.editorSession
        const doc = es.document
        const originalSelection = es.getSelection()
        if (table.area && table.area.cells) {
            es.transaction(tx => {
                let shouldCreate
                table.area.cells.forEach(cellId => {
                    const cell = doc.get(cellId)
                    const selection = tx.createSelection({
                        type: 'property',
                        path: cell.getPath(),
                        startOffset: 0,
                        endOffset: cell.getLength()
                    })

                    // Both transaction and editorSession selection has to be set
                    tx.setSelection(selection)
                    es.setSelection(selection)

                    if (typeof shouldCreate === 'undefined' && cell.getLength()) {
                        const commandMode = es.getCommandStates()['table-strong'].mode
                        shouldCreate = ['create', 'fuse', 'expand'].includes(commandMode)
                    }

                    const selectionState = es.getSelectionState()
                    console.info('Selection state:', selectionState)

                    console.info('Cell id:', cellId)
                    console.info('Created selection:', selection)
                    console.info('Transaction selection path:', tx.getSelection().getPath())
                    console.info('EditorSession selection path', es.getSelection().getPath())
                    es.executeCommand('table-cell-strong', {
                        transaction: tx,
                        shouldCreate: shouldCreate
                    })
                })
                tx.setSelection(originalSelection)
            })
            es.setSelection(originalSelection)
        }
    }
}

export default ToggleHeaderCommand
