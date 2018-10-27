package sonicrobots.com.mr808;

import android.os.Bundle;
import android.app.Activity;
import android.os.Handler;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.view.KeyEvent;
import android.util.Log;

/**
 * An example full-screen activity that shows and hides the system UI (i.e.
 * status bar and navigation/system bar) with user interaction.
 */
public class WebViewActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        WebView wView = new WebView(this);

        wView.getSettings().setJavaScriptEnabled(true);

        wView.setWebChromeClient(new WebChromeClient() {
            public void onProgressChanged(WebView view, int progress) {
            }
        });

        wView.setWebViewClient(new WebViewClient() {
            public void onReceivedError(final WebView view, WebResourceRequest req, WebResourceError error) {
                super.onReceivedError(view, req, error);
                Log.d("MR-808", "onReceivedError");
                scheduleLoad(view);
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse error) {
                super.onReceivedHttpError(view, request, error);
                Log.d("MR-808", "onReceivedHttpError");
                scheduleLoad(view);
            }
        });

        setContentView(wView);
        loadPage(wView);
    }

    private void scheduleLoad(final WebView view) {
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                loadPage(view);
            }
        }, 1000);
    }

    private void loadPage(WebView view) {
        Log.d("MR-808", "loading page");
        view.loadUrl("http://192.168.178.20:8080");
    }

    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        return false;
    }
}

/*

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.widget.Toast;
import android.view.KeyEvent;

public class Main extends Activity
{
    */
/**
 * Called when the activity is first created.
 *//*

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        WebView wView = new WebView(this);

        wView.getSettings().setJavaScriptEnabled(true);

        wView.setWebChromeClient(new WebChromeClient() {
            public void onProgressChanged(WebView view, int progress) {
            }
        });

        wView.setWebViewClient(new WebViewClient() {
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            }
        });

        setContentView(wView);
        wView.loadUrl("http://192.168.1.100");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        return false;
    }
}*/
