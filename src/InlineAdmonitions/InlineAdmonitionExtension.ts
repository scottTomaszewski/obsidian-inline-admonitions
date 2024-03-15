import {ViewUpdate, EditorView, ViewPlugin, Decoration, DecorationSet} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/state";
import {InlineAdmonition} from "./inlineAdmonition";
import {syntaxTree} from "@codemirror/language";

// Plugin/Extension to handle live-preview rendering of Inline Admonitions.
// Reference: https://github.com/liamcain/obsidian-lapel/blob/main/src/headingWidget.ts
// TODO - creates css classes based on admonitions
export function inlineAdmonitionPlugin(admonitions: InlineAdmonition[]) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			buildDecorations(view: EditorView): DecorationSet {
				const builder = new RangeSetBuilder<Decoration>();

				for (let {from, to} of view.visibleRanges) {
					syntaxTree(view.state).iterate({
						from,
						to,
						enter: (node) => {
							if (node.type.name.startsWith("inline-code")) {
								let {from: statementFrom, to: statementTo} = node;
								let content = view.state.doc.sliceString(statementFrom, statementTo);
								// console.log(node.type.name + "(" + from + ", " + to + ") - " + content);
								for (let admonition of admonitions) {
									if (admonition.appliesTo(node, content)) {
										builder.add(
											statementFrom,
											statementTo,
											Decoration.mark({
												inclusive: true,
												// attributes: {class: "iad iad-prefix " + admonition.cssClasses()},
												attributes: {class: admonition.cssClasses()},
												tagName: "span"
											})
										);
									}
								}
								return false;
							}
						},
					});
				}

				return builder.finish();
			}
		},
		{
			decorations: (view) => view.decorations,
		},
	);
}

