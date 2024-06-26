const static_css : string = `
span.iad,
code.iad {
    background-color: var(--tag-background);
    border: var(--tag-border-width) solid var(--tag-border-color);
    border-radius: var(--tag-radius);
    color: var(--tag-color);
    font-size: var(--tag-size);
    font-weight: var(--tag-weight);
    text-decoration: var(--tag-decoration);
    padding: var(--tag-padding-y) var(--tag-padding-x);
    line-height: 1;
}

.iad-setting-row {
    display: flex;
    justify-content: end;
}

.iad-setting-row * {
    margin-left: 0.5em;
}

.iad-setting-row-title {
    margin-right: auto;
    text-transform: capitalize;
    align-items: center;
    display: flex;
}

.iad-sample-editor {
    margin: 0.5em;
    display: inline-block;
}

.iad-hidden {
    display: none;
}

.cm-active .iad-hidden {
    display: inline;
}
`
