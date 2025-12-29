---
alwaysApply: true
---

# プロジェクト概要

本プロジェクトは Laravel + Inertia.js を採用したフルスタックアプリケーションである。

## 技術スタック

バックエンドは PHP 8.2 以上、Laravel 11.x、UUID v7（ID 生成）、deptrac（依存関係の静的解析）を使用する。

フロントエンドは React/TypeScript、Inertia.js、Tailwind CSS を使用する。

## ディレクトリ概要

バックエンドのビジネスロジックは `modules/` 配下に4層アーキテクチャで配置する。フロントエンドは `resources/js/` 配下に配置する。

## 基本原則

バックエンドの依存方向は `Presentation → Application → Domain ← Infrastructure` とする。モジュール間通信は Contract 経由のみ許可する。Domain 層は Laravel に依存してはならない。

フロントエンドはコンポーネント指向で設計し、ビジネスロジックとUIを分離する。
