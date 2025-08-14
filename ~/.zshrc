# Zsh Configuration File
# This file helps hide process lists and clean up terminal experience

# Disable automatic process listing
setopt NO_BG_NICE
setopt NO_HUP
setopt NO_CHECK_JOBS

# Hide job control messages
setopt NO_NOTIFY

# Disable flow control (Ctrl+S, Ctrl+Q)
setopt NO_FLOW_CONTROL

# Clean up prompt
export PS1="%n@%m %~ %# "

# Hide process list from jobs command
alias jobs='jobs -l' 2>/dev/null || true

# Disable automatic process listing in prompt
setopt PROMPT_SUBST

# Hide background job notifications
setopt NO_NOTIFY

# Clean up history
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE
setopt HIST_VERIFY

# Disable beep
setopt NO_BEEP

# Load your existing PATH and Homebrew
# Setting PATH for Python 3.13
PATH="/Library/Frameworks/Python.framework/Versions/3.13/bin:${PATH}"
export PATH

# Homebrew
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true


