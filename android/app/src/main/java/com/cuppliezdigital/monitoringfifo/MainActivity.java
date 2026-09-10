package com.cuppliezdigital.monitoringfifo;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    public static final String DEFAULT_SERVER_URL = "https://garapan-fifo-production.up.railway.app";
    private static final String PREFS_NAME = "MonitoringPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final int CAMERA_PERMISSION_CODE = 101;

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private LinearLayout errorContainer;
    private Button btnRetry;
    private Button btnChangeServer;

    private SharedPreferences preferences;
    private long backPressedTime = 0;
    private PermissionRequest pendingPermissionRequest;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on for warehouse PDA operations (no auto-sleep while working)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);

        preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        webView = findViewById(R.id.webView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        errorContainer = findViewById(R.id.errorContainer);
        btnRetry = findViewById(R.id.btnRetry);
        btnChangeServer = findViewById(R.id.btnChangeServer);

        setupSwipeRefresh();
        setupWebView();
        setupErrorView();

        // Check camera permission for mobile barcode camera scanning
        checkCameraPermission();

        // Load the server URL
        loadCurrentServerUrl();
    }

    private String getCurrentServerUrl() {
        return preferences.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
    }

    private void saveServerUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            url = DEFAULT_SERVER_URL;
        }
        url = url.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        preferences.edit().putString(KEY_SERVER_URL, url).apply();
    }

    private void loadCurrentServerUrl() {
        String url = getCurrentServerUrl();
        errorContainer.setVisibility(View.GONE);
        swipeRefreshLayout.setVisibility(View.VISIBLE);
        webView.loadUrl(url);
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setColorSchemeResources(R.color.primary, R.color.accent);
        swipeRefreshLayout.setOnRefreshListener(() -> {
            if (isNetworkAvailable()) {
                webView.reload();
            } else {
                swipeRefreshLayout.setRefreshing(false);
                showErrorScreen();
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        // Pass keyboard/laser focus to webview
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                errorContainer.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                swipeRefreshLayout.setRefreshing(false);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    showErrorScreen();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    if (!swipeRefreshLayout.isRefreshing()) {
                        swipeRefreshLayout.setRefreshing(true);
                    }
                } else {
                    swipeRefreshLayout.setRefreshing(false);
                }
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                pendingPermissionRequest = request;
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.getResources());
                } else {
                    ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
                }
            }
        });
    }

    private void setupErrorView() {
        btnRetry.setOnClickListener(v -> {
            if (isNetworkAvailable()) {
                loadCurrentServerUrl();
            } else {
                Toast.makeText(this, "Jaringan belum terhubung!", Toast.LENGTH_SHORT).show();
            }
        });

        btnChangeServer.setOnClickListener(v -> showServerUrlDialog());
    }

    private void showErrorScreen() {
        swipeRefreshLayout.setRefreshing(false);
        swipeRefreshLayout.setVisibility(View.GONE);
        errorContainer.setVisibility(View.VISIBLE);
    }

    public void showServerUrlDialog() {
        LayoutInflater inflater = LayoutInflater.from(this);
        View dialogView = inflater.inflate(R.layout.dialog_server_url, null);
        final EditText editServerUrl = dialogView.findViewById(R.id.editServerUrl);
        editServerUrl.setText(getCurrentServerUrl());

        new AlertDialog.Builder(this)
                .setTitle(R.string.change_server_url)
                .setView(dialogView)
                .setPositiveButton(R.string.save, (dialog, which) -> {
                    String newUrl = editServerUrl.getText().toString().trim();
                    saveServerUrl(newUrl);
                    Toast.makeText(this, "Alamat server diperbarui!", Toast.LENGTH_SHORT).show();
                    loadCurrentServerUrl();
                })
                .setNeutralButton(R.string.reset_default, (dialog, which) -> {
                    saveServerUrl(DEFAULT_SERVER_URL);
                    Toast.makeText(this, "Reset ke server Railway default!", Toast.LENGTH_SHORT).show();
                    loadCurrentServerUrl();
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        }
        return false;
    }

    private void checkCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
                    pendingPermissionRequest = null;
                }
            } else {
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.deny();
                    pendingPermissionRequest = null;
                }
            }
        }
    }

    // ==============================================================
    // HARDWARE PDA SCANNER BROADCAST RECEIVER (iData K3 Pro, Urovo, Chainway, Zebra, Honeywell)
    // ==============================================================
    private final BroadcastReceiver pdaScanReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null) return;
            String barcode = null;
            if (intent.hasExtra("value")) {
                barcode = intent.getStringExtra("value");
            } else if (intent.hasExtra("barcode")) {
                barcode = intent.getStringExtra("barcode");
            } else if (intent.hasExtra("data")) {
                barcode = intent.getStringExtra("data");
            } else if (intent.hasExtra("scannerdata")) {
                barcode = intent.getStringExtra("scannerdata");
            } else if (intent.hasExtra("com.symbol.datawedge.data_string")) {
                barcode = intent.getStringExtra("com.symbol.datawedge.data_string");
            } else if (intent.hasExtra("se4500")) {
                barcode = intent.getStringExtra("se4500");
            }

            if (barcode != null && !barcode.trim().isEmpty()) {
                deliverScannedBarcodeToWeb(barcode.trim());
            }
        }
    };

    private void registerPdaReceivers() {
        IntentFilter filter = new IntentFilter();
        // iData K3 Pro default broadcast actions
        filter.addAction("android.intent.action.SCANRESULT");
        filter.addAction("com.idatachina.SCANKEYEVENT");
        // Chainway / CILICO / Seuic / K3 broadcast actions
        filter.addAction("com.android.server.scannerservice.broadcast");
        filter.addAction("android.intent.action.BARCODE_BROADCAST");
        // Urovo broadcast actions
        filter.addAction("urovo.rcv.message");
        // Zebra DataWedge broadcast action
        filter.addAction("com.symbol.datawedge.data_string");
        filter.addAction("com.symbol.datawedge.api.RESULT_ACTION");
        // Honeywell ScanWedge broadcast action
        filter.addAction("com.honeywell.decode.intent.action.EDIT_DATA");

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.registerReceiver(this, pdaScanReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
            } else {
                registerReceiver(pdaScanReceiver, filter);
            }
        } catch (Exception ignored) {}
    }

    private void unregisterPdaReceivers() {
        try {
            unregisterReceiver(pdaScanReceiver);
        } catch (Exception ignored) {}
    }

    private void deliverScannedBarcodeToWeb(String barcode) {
        if (webView == null || barcode == null) return;
        final String clean = barcode.replaceAll("[\\r\\n\\t]", "").trim();
        if (clean.length() < 3) return;

        runOnUiThread(() -> {
            String script = "(function() {" +
                    "  var code = '" + clean.replace("'", "\\'") + "';" +
                    "  if (typeof handleScannedWaybill === 'function') {" +
                    "    if (typeof scannerModal !== 'undefined' && scannerModal && scannerModal.classList.contains('hidden') && typeof openScannerModal === 'function') {" +
                    "      openScannerModal();" +
                    "    }" +
                    "    handleScannedWaybill(code);" +
                    "  } else {" +
                    "    var inp = document.getElementById('scannerBarcodeInput');" +
                    "    if (inp) {" +
                    "      inp.value = code;" +
                    "      inp.dispatchEvent(new Event('input', { bubbles: true }));" +
                    "    }" +
                    "  }" +
                    "})();";
            webView.evaluateJavascript(script, null);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        registerPdaReceivers();
    }

    @Override
    protected void onPause() {
        super.onPause();
        unregisterPdaReceivers();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Pass hardware laser keystrokes directly to webView
        if (webView != null && webView.dispatchKeyEvent(event)) {
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        if (backPressedTime + 2000 > System.currentTimeMillis()) {
            super.onBackPressed();
        } else {
            Toast.makeText(this, "Tekan sekali lagi untuk keluar", Toast.LENGTH_SHORT).show();
            backPressedTime = System.currentTimeMillis();
        }
    }
}

