// jsdom stops short of a few layout and pointer APIs the Radix primitives call
// unconditionally. They are no-ops here: nothing lays out, so there is nothing to
// scroll into view or capture.
Element.prototype.scrollIntoView = () => {};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
