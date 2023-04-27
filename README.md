
# WPCEdit.js

WPCEdit.js is a JavaScript library that allows you to parse ROM files of Williams WPC Pinball games to retrieve DMD graphics and calculate new checksums. This library is a port of the Windows app WPC Edit that was released by Garrett Lee in 2004. The idea of this library is to provide a foundation for impementation of new apps, or for writing more specified scripts for extracting contents of the ROMs.

Most of the source code is a direct translation of the original C++ code, and there is lots of room for improvements in almost every aspect. Please feel free to contribute!

This readme is WIP, and a bit rudimentary at this stage. I will update with more details along the way.

An implementation of WPCEdit.js as a Vue web ap is available at
The source code of that project will probably be a good reference as well.

The original code for WPC Edit was published at https://github.com/lucky01/wpcedit

## Disclaimer

This software provides mechanisms for viewing and editing the contents of certain pinball machine ROM images. It is up to you to determine if this software can be used without violating any agreements that prohibits you from using this software. For example there may have been an agreement you agreed to when you obtained the ROM image. Additionally, you may be bound to an implicit agreement if your pinball machine came with a manual. The back cover of the manual may contain verbage that may make the use of this software a violation of the agreement.

## Installation

Install via npm: 
```
npm install wpcedit
```

Import it into your JavaScript code:

```javascript
import { WPCEdit } from 'wpcedit';
```


## API

### `.setRom(data)`

Provide this method with a ROM file as a `Uint8Array`. It will load and initialize the data. All other other features of the library are accessed through sub classes.

### `.verbose`

If you set this flag to true, all actions will be logged to the console. This will affect performance negatively but may be useful for debugging.

### `.fullFrameImage`

A subclass for accessing full frame images. It provides the following methods:

-   `getPlaneAt(index)`: Returns the plane at the specified index as a Uint8Array.
-   `minImageIndex`: Returns the minimum allowed image index.
-   `maxImageIndex`: Returns the maximum allowed image index.
-   `prev(steps)`: Move the image index back by the specified number of steps.
-   `next(steps)`: Move the image index forward by the specified number of steps.
-   `mergeImages(img1, img2, mask)`: Merge two full frame images into one using the specified mask.
-   `mergePlanes(img1, plane2)`: Merge two planes from different images into one.

### `.variableSizedImage`

A subclass for accessing variable-sized images such as sprites and fonts. It provides the following methods:

-   `getImageAt(table, index)`: Returns the image at the specified table and index as a Uint8Array.
-   `minImageIndex`: Returns the minimum allowed image index.
-   `maxImageIndex`: Returns the maximum allowed image index.
-   `minTableIndex`: Returns the minimum allowed table index.
-   `maxTableIndex`: Returns the maximum allowed table index.
-   `prev(steps)`: Move the image index back by the specified number of steps.
-   `next(steps)`: Move the image index forward by the specified number of steps.
-   `index`: Returns the current image index.
-   `table`: Returns the current table index.

### `.checksum`

A subclass for reading and writing checksum data. It provides the following methods:

-   `isValid()`: Returns true if the stored checksum of the current ROM is valid, false otherwise.
-   `update(version, force)`: Updates the checksum using the specified version number. If `force` is true, the checksum will be updated even if it's already valid.
-   `disable()`: Disables the checksum. This is done by setting the fixup bytes to 0xFF00. This will also remove other startup tests. Once the modified ROM is ready, you should always insert a correct checksum using the tool above so that the game will alert you about any errors.
-   `calculated`: Returns the calculated checksum as a number.
-   `stored`: Returns the stored checksum as a number.
-   `delta`: Returns the fixup bytes of the ROM as a number.



## Planes and images

An image in WPCEdit is returned as a `Uint8Array` where each bit represents a pixel. 

A plane is an object that contains an image, as well as some additional data:
-   `width`: The width of the image in pixels.
-   `height`: The height of the image in pixels.
-   `image`: The image, as a Uint8Array.
-   `mask`: A Uint8Array similar to the image data, but used as a mask when adding partial images on top of others.
-   `xor`: A Uint8Array similar to the image data, with XOR bits that will either invert or add to the image depending on the flags bytes (documentation coming).
-   `flags`: A Uint8Array of flags that help decide the state of the XOR bits (documentation coming).
-   `xOffset`: The x offset of a plane. This is currently not working.
-   `yOffset`: The y offset of a plane. This is currently not working.
-   `type`: The encoding type of the image in the ROM.
-   `address`: The ROM address of the image.
-   `tableAddress`: The ROM address of the image table. Only valid for variableSizedImages but currently not working as expected.


### Rendering
I would like to include an example implementation of a rendering, but for now you may check out the the code in WPC Edit vue app:


## License

WPCEdit.js is released as public domain, just like the original WPC Edit by Garrett Lee.

 `I hope that helps! Let me know if you have any further questions.`