# Changelog

## 1.7.0

- Adds support for Regex Inline Admonitions

## 1.6.1

- Corrects an issue with a background color appearing on inline-admonitions in live preview

## 1.6.0

- Adds mobile support (beta)
  - I dont have an apple device to test on, so please let me know if it works or not
    - Does anyone actually read the changelog?

## 1.5.2

- Corrects hide-trigger rending bug in settings preview
- Corrects prefix icon rendering bug in settings preview

## 1.5.1

- Corrects opacity rendering bug in settings preview

## 1.5.0

- Adds support for Prefix Icons and Suffix Icons
- Corrects some rendering issues

## 1.4.6

- Attempts to fix Inline-Admonitions failing in Live Preview on first install

## 1.4.5 

- [BUGFIX] Correctly triggers inline admonitions in Live Preview

## 1.4.4

- [BUGFIX] Avoids crash when css file is missing on first startup

## 1.4.2

- [BUGFIX] Avoids css class names resolving to the same value

## 1.4.1

- Adds support for changing opacity of background and text colors
  - Note: there is a bit of a performance impact of this feature. Will address in a patch

Known Issues:

- Multiple non-alphanumeric trigger text inline admonitions are overloading themselves.
  - Update: fixed in 1.4.2

## 1.3.2 

- [BUGFIX] Correctly enables css on plugin load

## 1.3.1 

- Enables the custom css file, although there is a known issue with the css snippet being enabled, but not picked up

## 1.3.0

- Adds support for Live Preview
- [BUGFIX] Removes debug logging

## 1.2.0

- Adds support for hiding the trigger string for prefix and suffix types
- Overhauls settings and codebase to better support future features

## 1.1.4

- Initial Release!
