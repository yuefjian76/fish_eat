#!/usr/bin/env python3
"""
preprocess_textures.py — 生成水平镜像无缝纹理

使用方式:
    python3 scripts/preprocess_textures.py [--source DIR] [--output DIR]

原理:
    原图宽度 1280px，水平镜像拼接后为 2560px。
    由于镜像与原图在接缝处完全对称，水平方向 tiling 时接缝处 diff=0。

前置依赖（可选，但推荐）:
    pip install pillow

若不安装 PIL，脚本会用纯 Python 跳过图像处理，仅输出文件清单和警告。
"""

import argparse
import os
import sys
import shutil
import json
from pathlib import Path

# ---------------------------------------------------------------------------
# 图像处理（可选）
# ---------------------------------------------------------------------------
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("WARNING: pillow not found —图像处理将被跳过，仅生成文件清单。")
    print("         安装以生成无缝纹理: pip install pillow")

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------
# 源纹理 → 输出文件名映射
TEXTURE_MAP = [
    # (源文件相对路径, 输出文件名)
    ("bg_undersea_theme.jpg",       "bg_undersea_seamless.jpg"),
    ("bg_tropical_theme.jpg",        "bg_tropical_seamless.jpg"),
    ("bg_polar_theme.jpg",           "bg_polar_seamless.jpg"),
    ("midground_undersea_theme.jpg", "mid_undersea_seamless.jpg"),
    ("midground_tropical_theme.jpg", "mid_tropical_seamless.jpg"),
    ("foreground_undersea_theme.jpg","fg_undersea_seamless.jpg"),
]

DEFAULT_SOURCE_DIR = Path("src/assets/images")
DEFAULT_OUTPUT_DIR = Path("src/assets/images/seamless")


# ---------------------------------------------------------------------------
# 核心逻辑
# ---------------------------------------------------------------------------
def create_seamless_pair(src_path: Path, dst_path: Path) -> bool:
    """
    将 src_path 图像水平镜像拼接，保存到 dst_path。
    返回 True 表示成功，False 表示跳过。
    """
    if not HAS_PIL:
        # 无 PIL 时，只创建占位文件提示
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        dst_path.write_text(f"# Placeholder: run with PIL to generate from {src_path}\n")
        return False

    try:
        img = Image.open(src_path)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")

        w, h = img.size
        # 水平镜像
        mirrored = img.transpose(Image.FLIP_LEFT_RIGHT)
        # 拼接: [原图 | 镜像]
        stitched = Image.new(img.mode, (w * 2, h))
        stitched.paste(img, (0, 0))
        stitched.paste(mirrored, (w, 0))

        dst_path.parent.mkdir(parents=True, exist_ok=True)
        stitched.save(dst_path, quality=95)
        return True
    except Exception as e:
        print(f"  ERROR processing {src_path}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="生成水平镜像无缝纹理")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE_DIR,
                        help=f"源图片目录（默认: {DEFAULT_SOURCE_DIR}）")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_DIR,
                        help=f"输出目录（默认: {DEFAULT_OUTPUT_DIR}）")
    args = parser.parse_args()

    print(f"源目录: {args.source}")
    print(f"输出目录: {args.output}")
    print()

    # 创建输出目录
    args.output.mkdir(parents=True, exist_ok=True)

    results = []
    for src_rel, dst_name in TEXTURE_MAP:
        src_path = args.source / src_rel
        dst_path = args.output / dst_name

        if not src_path.exists():
            print(f"  SKIP (源文件不存在): {src_path}")
            results.append((src_rel, "MISSING"))
            continue

        success = create_seamless_pair(src_path, dst_path)
        if success:
            size_kb = dst_path.stat().st_size // 1024
            print(f"  OK   {src_rel} → {dst_name} ({size_kb}KB, {dst_path.stat().st_size // 1024 // 1024}MB)")
            results.append((src_rel, "OK"))
        else:
            print(f"  SKIP (PIL 不可用，占位已创建): {dst_name}")
            results.append((src_rel, "PLACEHOLDER"))

    print()
    print("=" * 60)
    print("完成。输出文件列表:")
    for src_rel, status in results:
        print(f"  [{status}] {src_rel}")
    print()
    if not HAS_PIL:
        print("NOTE: 安装 pillow 以生成真实纹理:")
        print("      pip install pillow")
        print("      然后重新运行本脚本")


if __name__ == "__main__":
    main()