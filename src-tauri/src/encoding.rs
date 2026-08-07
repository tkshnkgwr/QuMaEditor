//! # 文字エンコーディング検出および相互変換モジュール
//!
//! Shift_JIS, EUC-JP, UTF-8 などの多言語文字コード判定および並列変換処理を提供します。

use encoding_rs::{EUC_JP, SHIFT_JIS, UTF_8};
use serde::{Deserialize, Serialize};
use specta::Type;

/// エンコーディング検出結果構造体
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct EncodingDetectResult {
    /// 検出された文字コード名 (例: "UTF-8", "Shift_JIS", "EUC-JP")
    pub encoding: String,
    /// UTF-8 に変換されたテキスト本文
    pub text: String,
}

/// バイト配列から文字コードを自動判定し UTF-8 に変換する
///
/// # Arguments
/// * `bytes` - 対象のバイトデータ
pub fn detect_and_convert_to_utf8(bytes: Vec<u8>) -> Result<EncodingDetectResult, String> {
    if bytes.is_empty() {
        return Ok(EncodingDetectResult {
            encoding: "UTF-8".to_string(),
            text: String::new(),
        });
    }

    // 1. UTF-8 チェック
    if let Ok(utf8_str) = std::str::from_utf8(&bytes) {
        return Ok(EncodingDetectResult {
            encoding: "UTF-8".to_string(),
            text: utf8_str.to_string(),
        });
    }

    // 2. Shift_JIS 試行
    let (sjis_text, _, sjis_had_errors) = SHIFT_JIS.decode(&bytes);
    if !sjis_had_errors {
        return Ok(EncodingDetectResult {
            encoding: "Shift_JIS".to_string(),
            text: sjis_text.into_owned(),
        });
    }

    // 3. EUC-JP 試行
    let (euc_text, _, euc_had_errors) = EUC_JP.decode(&bytes);
    if !euc_had_errors {
        return Ok(EncodingDetectResult {
            encoding: "EUC-JP".to_string(),
            text: euc_text.into_owned(),
        });
    }

    // 4. ロスレス UTF-8 フォールバック
    let (fallback_text, _, _) = UTF_8.decode(&bytes);
    Ok(EncodingDetectResult {
        encoding: "UTF-8 (Lossy)".to_string(),
        text: fallback_text.into_owned(),
    })
}

/// UTF-8 テキストを指定されたエンコーディングバイト配列に変換する
///
/// # Arguments
/// * `text` - 変換対象の UTF-8 テキスト
/// * `target_encoding` - 変換先エンコーディング名 (例: "Shift_JIS", "EUC-JP", "UTF-8")
pub fn convert_utf8_to_encoding(text: String, target_encoding: String) -> Result<Vec<u8>, String> {
    match target_encoding.to_uppercase().as_str() {
        "UTF-8" | "UTF8" => Ok(text.into_bytes()),
        "SHIFT_JIS" | "SHIFT-JIS" | "SJIS" => {
            let (cow, _, had_errors) = SHIFT_JIS.encode(&text);
            if had_errors {
                return Err("Shift_JIS への変換中に未対応文字が検出されました".to_string());
            }
            Ok(cow.into_owned())
        }
        "EUC-JP" | "EUCJP" => {
            let (cow, _, had_errors) = EUC_JP.encode(&text);
            if had_errors {
                return Err("EUC-JP への変換中に未対応文字が検出されました".to_string());
            }
            Ok(cow.into_owned())
        }
        _ => Err(format!("未対応のエンコーディングです: {}", target_encoding)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_and_convert_to_utf8_utf8() {
        let sample = "こんにちは、QuMaEditor!";
        let bytes = sample.as_bytes().to_vec();
        let res = detect_and_convert_to_utf8(bytes).unwrap();
        assert_eq!(res.encoding, "UTF-8");
        assert_eq!(res.text, sample);
    }

    #[test]
    fn test_detect_and_convert_to_utf8_shift_jis() {
        let sample = "テストデータ";
        let (sjis_bytes, _, _) = SHIFT_JIS.encode(sample);
        let res = detect_and_convert_to_utf8(sjis_bytes.to_vec()).unwrap();
        assert_eq!(res.encoding, "Shift_JIS");
        assert_eq!(res.text, sample);
    }

    #[test]
    fn test_convert_utf8_to_encoding_sjis() {
        let text = "QuMaEditor テストデータ";
        let bytes = convert_utf8_to_encoding(text.to_string(), "Shift_JIS".to_string()).unwrap();
        assert!(!bytes.is_empty());
        let (decoded, _, _) = SHIFT_JIS.decode(&bytes);
        assert_eq!(decoded, text);
    }

    #[test]
    fn test_convert_utf8_to_encoding_euc_jp() {
        let text = "QuMaEditor EUCテスト";
        let bytes = convert_utf8_to_encoding(text.to_string(), "EUC-JP".to_string()).unwrap();
        assert!(!bytes.is_empty());
        let (decoded, _, _) = EUC_JP.decode(&bytes);
        assert_eq!(decoded, text);
    }
}
