# Invoked only after the user clicks the microphone. No command text is executed.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$recognizer = $null
try {
    Add-Type -AssemblyName System.Speech
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
    $recognizer.SetInputToDefaultAudioDevice()
    $result = $recognizer.Recognize([TimeSpan]::FromSeconds(8))
    if ($null -eq $result) {
        @{ ok = $false; error = 'No speech heard. Click the microphone and try again.' } | ConvertTo-Json -Compress
    } else {
        @{ ok = $true; text = $result.Text } | ConvertTo-Json -Compress
    }
} catch {
    @{ ok = $false; error = 'Windows speech recognition is unavailable. Check microphone access and install a Windows speech language in Settings > Time & language > Speech. You can still type commands.' } | ConvertTo-Json -Compress
} finally {
    if ($null -ne $recognizer) { $recognizer.Dispose() }
}
