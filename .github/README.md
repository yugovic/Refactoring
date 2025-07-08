# GitHub Actions セットアップガイド

## Claude GitHub Integration

このリポジトリはClaude AIとの統合を設定しています。

### セットアップ手順

1. **GitHub Secretsの設定**
   - リポジトリの Settings → Secrets and variables → Actions に移動
   - 以下のシークレットを追加:
     - `ANTHROPIC_API_KEY`: Anthropic APIキー

2. **使用方法**
   - Issue や Pull Request で `@claude` をメンションすると、Claudeがコードレビューを実行します
   - 例: `@claude このコードをレビューしてください`

### ワークフローの動作

- Issue コメント
- Pull Request コメント 
- 新規 Issue
- 新規 Pull Request

上記のいずれかで `@claude` がメンションされると、自動的にコードレビューが実行されます。

### トラブルシューティング

- ワークフローが動作しない場合は、GitHub Actions が有効になっているか確認してください
- APIキーが正しく設定されているか確認してください
- リポジトリの Actions 権限が適切に設定されているか確認してください