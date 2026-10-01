# AA-VIS-003 — Grimoire Base Cover

Status: CANONICAL
Version: 1.0
Category: grimoires / cover
File: `public/assets/grimoires/aa-grimoire-cover-base.svg`

## Purpose

Fallback cover for Grimórios that do not have an approved specific cover asset.

## Usage rule

Use the base cover only when a specific approved cover is not available. A persisted user cover may be used when its URL/source is valid and authorized by the application.

## Accessibility

The asset carries an internal title and description for direct document use. In the application list it is decorative and uses an empty `alt`; the adjacent title and description remain the semantic content.

## Restrictions

Do not treat this fallback cover as a user-specific identity. Do not overwrite a valid approved custom cover with this asset.
