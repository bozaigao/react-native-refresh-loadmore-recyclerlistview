# react-native-refresh-loadmore-recyclerlistview
#安装
nstall --save react-native-refresh-loadmore-recyclerlistview`

RecyclerListView was built with performance in mind which means no blanks while quick scrolls or frame drops.
RecyclerListView encourages you to have deterministic heights for items you need to render. This does not mean that you need to have all items of same height and stuff, all you need
is a way to look at the data and compute height upfront so that RecyclerListView can compute layout in one pass rather than waiting for the draw to happen.
You can still do all sorts of GridViews and ListViews with different types of items which are all recycled in optimal ways. Type based recycling is very easy
to do and comes out of the box.

In case you really need non deterministic rendering set `forceNonDeterministicRendering` prop to true on RecyclerListView. This increases layout thrashing and thus, will
not be as fast.


## Demo

**Production Flipkart Grocery Demo Video (or try the app):** https://youtu.be/6YqEqP3MmoU
**Infinite Loading/View Change (Expo):** https://snack.expo.io/@naqvitalha/rlv-demo
**Mixed ViewTypes:** https://snack.expo.io/B1GYad52b
**Sample project:** https://github.com/naqvitalha/travelMate
**Web Sample (Using RNW):** https://codesandbox.io/s/k54j2zx977, https://jolly-engelbart-8ff0d0.netlify.com/
**Context Preservation Sample:** https://github.com/naqvitalha/recyclerlistview-context-preservation-demo

**Other Video:** https://www.youtube.com/watch?v=Tnv4HMmPgMc

[![Watch Video](https://img.youtube.com/vi/Tnv4HMmPgMc/0.jpg)](https://www.youtube.com/watch?v=Tnv4HMmPgMc)

## Props
For full feature set have a look at prop definitions of [RecyclerListView](https://github.com/Flipkart/recyclerlistview/blob/21049cc89ad606ec9fe8ea045dc73732ff29eac9/src/core/RecyclerListView.tsx#L540-L634)
(bottom of the file). All `ScrollView` features like `RefreshControl` also work out of the box.

## Guides
* **[Sample Code](https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides/samplecode)**
* **[Performance](https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides/performance)**
* **Web Support:** Works with React Native Web out of the box. For use with ReactJS start importing from `recyclerlistview/web` e.g., `import { RecyclerListView } from "recyclerlistview/web"`. Use aliases if you want to preserve import path. Only platform specific code is part of the build so, no unnecessary code will ship with your app.
* **Polyfills Needed:** `requestAnimationFrame`

## License
**[Apache v2.0](https://github.com/Flipkart/recyclerlistview/blob/master/LICENSE.md)**

## Contact Us
Please open issues for any bugs that you encounter. You can reach out to me on twitter [@naqvitalha](https://www.twitter.com/naqvitalha) or, write to cross-platform@flipkart.com for any questions that
you might have.
