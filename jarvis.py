#!/usr/bin/env python3
"""JARVIS -- Your AI-powered terminal assistant."""

import config
import chat
import ui


def main():
    config.load()
    ui.show_banner()
    try:
        chat.run()
    except KeyboardInterrupt:
        ui.show_farewell()


if __name__ == "__main__":
    main()
