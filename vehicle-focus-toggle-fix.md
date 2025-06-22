# 車両フォーカスボタンのトグル動作修正

## 修正内容

### 問題
車両フォーカスボタンを複数回押すと、さらにズームインしてしまう

### 解決策
フォーカス状態を管理し、2回目のクリックで元のカメラ位置に戻るトグル動作を実装

## 実装詳細

### 1. UIManagerに状態フラグを追加
```javascript
// コンストラクタで初期化
this.isVehicleFocused = false;  // 車両フォーカス状態フラグ
```

### 2. focusOnVehicle()メソッドの修正
```javascript
// 既にフォーカス状態の場合は元に戻る
if (this.isVehicleFocused) {
    this.returnToDefaultCamera();
    return;
}

// フォーカス完了時にフラグを設定
onComplete: () => {
    console.log('Vehicle focus completed');
    // フォーカス状態フラグを設定
    this.isVehicleFocused = true;
    // 元に戻るボタンを表示
    this.showReturnToCameraButton();
}
```

### 3. returnToDefaultCamera()メソッドの修正
```javascript
// フォーカス状態フラグをリセット
this.isVehicleFocused = false;
```

## 動作
1. **1回目のクリック**: 車両にズームイン
2. **2回目のクリック**: 元のカメラ位置に戻る（トグル動作）
3. **「元のカメラに戻る」ボタン**: 同様に元の位置に戻る

これにより、車両フォーカスボタンがトグルボタンとして機能するようになりました。