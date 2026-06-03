# リリースとインストールの手順

このドキュメントでは、TubeFilterの新しいバージョンをリリースする方法と、それを Chrome / Firefox にインストールする方法を説明します。

## 1. 新しいバージョンをリリースする (開発者向け)

GitHub上で新しいリリースを作成すると、GitHub Actions が自動的にビルドを実行し、Chrome 版と Firefox 版のインストール用ファイルが生成されます。

1.  リリース前に `package.json` の `version` を更新します（manifest のバージョンはここから生成されます）。
2.  **GitHubのリポジトリページ**を開きます。
3.  画面右側の **"Releases"** セクションにある **"Create a new release"** をクリックします。
4.  **"Choose a tag"** をクリックし、新しいバージョン番号（例: `v1.0.1`）を入力して、"Create new tag" を選択します。
5.  **"Release title"** にリリースのタイトル（例: `v1.0.1 - バグ修正`）を入力します。
6.  **"Describe this release"** に変更内容の説明を記述します。
7.  **"Publish release"** ボタンをクリックします。

これを行うと、GitHub Actions が自動的に動き出します。数分後、リリースページの **"Assets"** セクションに次の 2 つのファイルが追加されます。

- `tube-filter-<version>-chrome.zip` … Chrome / Chromium 用
- `tube-filter-<version>-firefox.zip` … Firefox 用

> ローカルで同じ成果物を作るには `npm run zip`（Chrome）と `npm run zip:firefox`（Firefox）を実行します。出力は `.output/` 配下に生成されます。

## 2. 拡張機能をダウンロードする (ユーザー向け)

1.  GitHubのリポジトリの **"Releases"** ページを開きます。
2.  最新のリリース（"Latest" タグが付いているもの）を探します。
3.  **"Assets"** セクションから、使っているブラウザに合わせて以下のいずれかをダウンロードします。
    - Chrome / Chromium → **`tube-filter-<version>-chrome.zip`**
    - Firefox → **`tube-filter-<version>-firefox.zip`**
4.  ダウンロードした zip を解凍（展開）します。
    *   解凍すると、中に `manifest.json` や `icon` フォルダ、`content-scripts` / `popup.html` などが含まれていることを確認してください。

## 3. Chrome にインストールする

この拡張機能は Chrome ウェブストアで公開されていないため、「デベロッパーモード」を使ってインストールします。

1.  Google Chrome を開きます。
2.  アドレスバーに `chrome://extensions/` と入力して Enter キーを押します（または、右上のメニュー > 拡張機能 > 拡張機能を管理）。
3.  画面右上にある **「デベロッパーモード」** のスイッチを **ON** にします。
4.  左上に表示された **「パッケージ化されていない拡張機能を読み込む」** ボタンをクリックします。
5.  先ほど解凍したフォルダ（`manifest.json` が入っているフォルダ）を選択します。
6.  一覧に **TubeFilter** が追加されればインストール完了です！

## 4. Firefox にインストールする

Firefox では、署名前の拡張機能は「一時的なアドオン」として読み込みます（Firefox を再起動すると解除されます）。

1.  Firefox を開きます。
2.  アドレスバーに `about:debugging#/runtime/this-firefox` と入力して Enter キーを押します。
3.  **「一時的なアドオンを読み込む...」** をクリックします。
4.  解凍したフォルダ内の `manifest.json` を選択します。
5.  一覧に **TubeFilter** が追加されればインストール完了です。

> 恒久的にインストールするには [addons.mozilla.org (AMO)](https://addons.mozilla.org/) での署名・公開が必要です。提出時は `wxt zip -b firefox` が生成するソース zip（`tube-filter-<version>-sources.zip`）も併せて提出します。

## 5. 拡張機能を更新する

新しいバージョンがリリースされた場合の更新手順です。

1.  上記「2. 拡張機能をダウンロードする」の手順で、新しい zip をダウンロード・解凍します。
2.  **Chrome**: 古いフォルダの中身を新しいフォルダの中身で上書きするか、古いフォルダを削除して新しいフォルダを同じ場所に置き、`chrome://extensions/` の TubeFilter カードにある **更新アイコン（回転矢印）** をクリックするか、ページ全体を再読み込みします。
3.  **Firefox**: `about:debugging#/runtime/this-firefox` で TubeFilter の **「再読み込み」** をクリックするか、新しいフォルダの `manifest.json` を改めて読み込みます。
