function dedent(html) {
    const lines = html.split('\n');

    // drop a fully blank first/last line — these are just artifacts of
    // how people format the inside of a <pre> tag
    if (lines[0].trim() === '') lines.shift();
    if (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

    const indents = lines
        .filter(line => line.trim() !== '')
        .map(line => line.match(/^[ \t]*/)[0].length);
    const minIndent = indents.length ? Math.min(...indents) : 0;

    return lines.map(line => line.slice(minIndent)).join('\n');
}

document.querySelectorAll('pre.code-block').forEach(pre => {
    pre.innerHTML = dedent(pre.innerHTML);
});