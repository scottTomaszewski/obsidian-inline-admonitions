# Inline Admonitions for Obsidian

This plugin will allow you to format inline codeblocks to better stand out on the page.  For example, you may want to 
have all inline codeblocks that start with "IMPORTANT" to have a red background.  Where a codeblock may normally look 
like this:

![no admonition](no-admonition.png)

This plugin can change it to look like this:

![img.png](admonition.png)

And its easy to use!

![demo](./demo.gif)

## Creating a new Inline Admonition

Open the "Inline Admonition" and click "Create New Inline Admonition" at the top to bring up a Modal to configure a new 
Inline Admonition

![admonition-modal.png](admonition-modal.png)

- **Prefix** is the string at the front of the codeblock used to trigger the formatting.
- **Background Color** is the color of the Inline Admonition "bubble"
- **Color** is the text color

## Notes

- This plugin is in alpha.  No promises on results...
- The CSS of the Inline Admonitions rides on Obsidian's Tag css.  I'll clean this up in a future release.
- Saving settings will trigger a re-render of the markdown views. Its possible to avoid this and is planned for a future release
- Similar to Contexual Typography this plugin will give you some css classes that you can manually manipulate

## Future work

- Alternative "basic" triggers in addition to `startsWith`
  - `contains`
  - `endsWith`
- Regex to trigger Inline Admonitions
- Full CSS manipulation of 
