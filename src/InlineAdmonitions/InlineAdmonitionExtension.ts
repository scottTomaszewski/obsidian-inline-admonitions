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
								let content = view.state.doc.sliceString(node.from, node.to);
								// console.log(node.type.name + "(" + node.from + ", " + node.to + ") - " + content);
								admonitions.forEach(iad => iad.applyTo(node, content, builder));
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

