// Marks the first use of each glossary term in a markdown page.
// Only text sitting directly in paragraphs and list items is touched, so links, code and headings stay as written.
import { split } from './glossary';

export default function glossaryPlugin() {
  const seen = new Set<string>();
  return {
    name: 'glossary',
    element: {
      filter: ['p', 'li'],
      visit(node: any, ctx: any) {
        for (const child of [...(node.children ?? [])]) {
          if (child.type !== 'text') continue;
          const pieces = split(child.value, seen);
          if (pieces.length === 1 && typeof pieces[0] === 'string') continue;
          ctx.replaceNode(
            child,
            pieces.map((p) =>
              typeof p === 'string'
                ? { type: 'text', value: p }
                : {
                    type: 'element',
                    tagName: 'span',
                    properties: { className: ['gl'], tabIndex: 0, dataDef: p.term.def },
                    children: [{ type: 'text', value: p.text }],
                  },
            ),
          );
        }
      },
    },
  };
}
