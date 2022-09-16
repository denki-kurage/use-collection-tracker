# use-collection-tracker

Reactでリストの複数のアイテムをまとめて変更するためのトラッキング

考え方的なもはこちら。

[https://kurage-worker.com/2022/collection-tracking-edit-db](https://kurage-worker.com/2022/collection-tracking-edit-db)


デモページはこちら。

[https://denki-kurage.github.io/use-collection-tracker/public/](https://denki-kurage.github.io/use-collection-tracker/public/)


## 例



## 最低限の環境を整える

```sh
npm init
npm install --save-dev typescript webpack webpack-cli
npm install --save-dev ts-loader sass-loader css-loader style-loader sass
npm install react react-dom
npm install --save-dev @types/react @types/react-dom

npx webpack init
npx tsc --init
```
