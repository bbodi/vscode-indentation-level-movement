'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
import {
    window,
    commands,
    Disposable,
    ExtensionContext,
    StatusBarAlignment,
    StatusBarItem,
    TextDocument,
    Position,
    Range,
    Selection,
} from 'vscode'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    let indentationLevelMover = new IndentationLevelMover();

    var moveDown = commands.registerCommand('extension.moveDown', () => {
        indentationLevelMover.moveDown();
    });

    var moveUp = commands.registerCommand('extension.moveUp', () => {
        indentationLevelMover.moveUp();
    })

    context.subscriptions.push(indentationLevelMover);
    context.subscriptions.push(moveDown);
    context.subscriptions.push(moveUp);
}

// this method is called when your extension is deactivated
export function deactivate() {
}


class IndentationLevelMover {
    public moveDown() {
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        let currentLineNumber = editor.selection.start.line;
        let currentLevel = this.indentationLevelForLine(currentLineNumber);
        let position = editor.selection.active;
        let nextLine = this.findNextLine(currentLineNumber, currentLevel)

        if (currentLevel < 0) {
            currentLevel = 0;
        }

        let newPosition = position.with(nextLine, currentLevel);
        let selection = new Selection(newPosition, newPosition);
        editor.selection = selection;
    }

    public moveUp() {
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        let currentLineNumber = editor.selection.start.line;
        let currentLevel = this.indentationLevelForLine(currentLineNumber);

        let position = editor.selection.active;
        let newPosition = position.with(this.findPreviousLine(currentLineNumber, currentLevel), currentLevel);
        let selection = new Selection(newPosition, newPosition);
        editor.selection = selection;
    }

    public indentationLevelForLine(lineToCheck) {
        let editor = window.activeTextEditor;
        let line = editor.document.lineAt(lineToCheck);

        if (line.text.toString().length === 0) { // TODO check for whitespace-only lines as well
            return -1;
        } else {
            return line.firstNonWhitespaceCharacterIndex;
        }
    }

    public findNextLine(currentLineNumber, currentIndentationLevel: Number) {
        let editor = window.activeTextEditor;
        let indentationChanged = false;
        let changedAtFirstCheckedLine = false;
        let indentationLevelToSearchFor = currentIndentationLevel;

        for (let lineNumber = currentLineNumber + 1; lineNumber < editor.document.lineCount; lineNumber++) {
            let indentationForLine = this.indentationLevelForLine(lineNumber);

            if (indentationLevelToSearchFor !== indentationForLine) {
                indentationChanged = true;
            }

            if (indentationChanged && lineNumber === currentLineNumber + 1) {
                changedAtFirstCheckedLine = true;
            }

            if (changedAtFirstCheckedLine){
                changedAtFirstCheckedLine = false;
                indentationLevelToSearchFor = indentationForLine;
                continue;
            }

            if (indentationChanged && indentationForLine !== indentationLevelToSearchFor) {
                if (currentIndentationLevel !== indentationLevelToSearchFor || currentIndentationLevel < 0) {
                    return lineNumber
                } else {
                    return lineNumber - 1;
                }
            }
        }
    }

    public findPreviousLine(currentLineNumber, currentIndentationLevel: Number) {
        let editor = window.activeTextEditor;
        let indentationChanged = false;
        let changedAtFirstCheckedLine = false;

        for (let lineNumber = currentLineNumber + 1; lineNumber > 0; lineNumber--) {
            let indentationForLine = this.indentationLevelForLine(lineNumber);

            if (currentIndentationLevel !== indentationForLine) {
                indentationChanged = true;
            }

            if (indentationChanged && lineNumber === currentLineNumber - 1) {
                changedAtFirstCheckedLine = true;
            }

            // Don't count blank/empty lines
            if (indentationForLine < 0) {
                continue;
            }

            if (indentationChanged && indentationForLine <= currentIndentationLevel) {
                return changedAtFirstCheckedLine ? lineNumber : lineNumber - 1;
            }
        }
    }

    dispose() {
    }
}