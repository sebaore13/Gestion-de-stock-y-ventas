param(
  [string]$printerName,
  [string]$filePath
)

# C# wrapper for winspool.drv Raw Printer API
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, ExactSpelling=false, SetLastError=true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, ExactSpelling=false, SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, ExactSpelling=false, SetLastError=true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] ref DOCINFO pDocInfo);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, ExactSpelling=false, SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, ExactSpelling=false, SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, ExactSpelling=false, SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, ExactSpelling=false, SetLastError=true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern int GetLastError();

    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct DOCINFO {
        public int cbSize;
        public string lpszDocName;
        public string lpszOutput;
        public string lpszDatatype;
    }

    public static void SendRawBytes(string printerName, byte[] data) {
        IntPtr hPrinter;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero))
            throw new Exception("No se pudo abrir la impresora. Error: " + GetLastError());
        try {
            DOCINFO di = new DOCINFO();
            di.cbSize = Marshal.SizeOf(typeof(DOCINFO));
            di.lpszDocName = "PitstopPRO";
            di.lpszDatatype = "RAW";
            if (!StartDocPrinter(hPrinter, 1, ref di))
                throw new Exception("StartDocPrinter fallo. Error: " + GetLastError());
            try {
                if (!StartPagePrinter(hPrinter))
                    throw new Exception("StartPagePrinter fallo. Error: " + GetLastError());
                IntPtr pBytes = Marshal.AllocHGlobal(data.Length);
                Marshal.Copy(data, 0, pBytes, data.Length);
                int written;
                if (!WritePrinter(hPrinter, pBytes, data.Length, out written))
                    throw new Exception("WritePrinter fallo. Error: " + GetLastError());
                Marshal.FreeHGlobal(pBytes);
                if (!EndPagePrinter(hPrinter))
                    throw new Exception("EndPagePrinter fallo. Error: " + GetLastError());
            } finally {
                EndDocPrinter(hPrinter);
            }
        } finally {
            ClosePrinter(hPrinter);
        }
    }
}
"@

try {
  $bytes = [System.IO.File]::ReadAllBytes($filePath)
  [RawPrinter]::SendRawBytes($printerName, $bytes)
  Write-Host "OK"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
