function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

if (!Object.keys) {
    Object.keys = function(obj) {
        var keys = [];

        for ( var i in obj) {
            if (obj.hasOwnProperty(i)) {
                keys.push(i);
            }
        }

        return keys;
    };
}

$(document).ready(function() {
    /**
     * Initialise the mobile orientation handler
     */
    MobileOrientationHandler.initialise();

    /**
     * Initialise timeline with settings defined in settings.js
     */
    Timeline.initialise(0, timelineSettings);

    /**
     * Initialise contrast progress bar with settings defined in settings.js
     */
    ContrastProgress.initialise(timelineSettings);

    /**
     * Initialise the social icons with settings defined in settings.js
     */
    SocialIcons.initialise(socialIconSettings);

    /**
     * Initialise cta buttons with settings defined in settings.js
     */
    CtaButtons.initialise(ctaButtonSettings);

    /**
     * Initialise promos with settings defined in settings.js
     */
    Promos.initialise(promoSettings);

    /**
     * Initialise volume slider
     */
    VolumeSlider.initialise();

    /**
     * Initialise language selector
     */
    LanguageSelector.initialise();

    /**
     * Initialise closed caption selector
     */
    ClosedCaptionSelector.initialise();

    /**
     * Initialise video player interface and quality selector with settings defined in settings.js
     */
    VideoPlayerInterface.initialise(chapterSettings);

    /**
     * Initialise the keyboard input controller
     */
    KeyboardInputController.initialise();
});

var BufferStatus = {

    seenStates: [],

    initBuffer: function () {
        if(Timeline.SettingsJsonObject.BufferBarEnabled){
            BufferStatus.createBufferDivs();
        }
    },

    createBufferDivs: function () {
        var counter = 1;

        var bufferSectionHTMLTemplate =
            '<div id="jsBufferSection" class="timeline__buffer-section"> \
                <div id="jsSectionInner" class="timeline__buffer-section-inner"></div> \
            </div>';

        var bufferTimeline = $('#jsBufferTimeline');

        $('.jsTimelineState').each(function () {
            var stateTemplate = $(bufferSectionHTMLTemplate).clone();
            var stateName = $(this).data('state');
            var stateWidth = $(this).data('percent-width');
            stateTemplate.attr('id', 'jsBufferSection'+counter);
            stateTemplate.data('interaction-id', stateName);
            stateTemplate.find('.timeline__buffer-section-inner').attr('id', 'jsSectionInner' + stateName);
            stateTemplate.css('width', stateWidth + "%");
            bufferTimeline.append(stateTemplate);
            counter++;
        });
        BufferStatus.applyBufferSettings();
    },

    applyBufferSettings: function () {
        var opacity = Timeline.SettingsJsonObject.BufferBarOpacity;
        var color = Timeline.SettingsJsonObject.BufferBarColor;
    },

    updateBuffer: function () {
        if(LanguageSelector.currentLanguageObj !== {}){
            try {
                var videoTimes = VideoPlayerInterface.iframeWindow.rtc.player.getVideoTimes(),
                    currentState = Timeline.getStateFromProgress(true),
                    chapters = VideoPlayerInterface.getVideoChapters();

                //Checks if the video has reached the end and prevents the introduction buffer bar loading
                if(Timeline.getProgress() !== 1){
                    if(isInArray(currentState,BufferStatus.seenStates)){
                        $.each(chapters, function(state, chapter) {
                            state = VideoPlayerInterface.mapStateReverse(state);

                            if (videoTimes.buffered > chapter.start + chapter.duration) {
                                BufferStatus.updateStateBufferProgress(state, 100);
                            } else {
                                BufferStatus.updateStateBufferProgress(
                                    state,
                                    ((videoTimes.buffered - chapter.start) / chapter.duration) * 100
                                );
                            }
                        });
                    }
                }
                if(!isInArray(currentState,BufferStatus.seenStates)){
                    BufferStatus.seenStates.push(currentState);
                }
                BufferStatus.clearOldBuffers(currentState);
            } catch (e) {}
        }
    },

    clearOldBuffers: function (currentState) {
        for (var i=0; i < BufferStatus.seenStates.length; i++){
            var state = BufferStatus.seenStates[i];
            if(state !== currentState) {
                BufferStatus.updateStateBufferProgress(state,0);
            }
        }
    },

    //State is the id of the interaction card as a string.
    updateStateBufferProgress: function(state, percentage) {
        if (typeof state === "string"){
            $('#jsSectionInner'+state).css('width', percentage + "%");
        }
    }
};

var ClosedCaptionSelector = {

    initialise: function () {
        ClosedCaptionSelector.events.initialise();
        $('#jsCCOffTick').show();
        $('#jsCCOnTick').hide();
    },

    setClosedCaptions: function(value){
        var captionsOn = VideoPlayerInterface.iframeWindow.rtc.player.vars.showCaptions;
        if (value === 'on' && !captionsOn) {
            VideoPlayerInterface.iframeWindow.rtc.player.toggleCC();
            $('#jsCCOnTick').show();
            $('#jsCCOffTick').hide();
        } else if (value === 'off' && captionsOn) {
            VideoPlayerInterface.iframeWindow.rtc.player.toggleCC();
            $('#jsCCOffTick').show();
            $('#jsCCOnTick').hide();
        }
    },

    events: {
        /**
         * Link up the events and the event handlers
         */
        initialise: function() {
            $('#jsCCMenuTitle').click(ClosedCaptionSelector.events.closeCCMenu);
            $('.jsTimelineSettingsCaption').click(ClosedCaptionSelector.events.ccItemClickEventHandler);
        },

        closeCCMenu: function (e) {
            $('#jsSettingsButtonPopout').show();
            $('#jsCCSelectorPopout').hide();
            $("#jsCCMenuItem").focus();
        },

        ccItemClickEventHandler: function(e) {
            //off or on
            var newValue = $(this).data('value');
            ClosedCaptionSelector.setClosedCaptions(newValue);
        }
    }
};

var ContrastProgress = {
    initialise: function (timelineSettings){
        if (timelineSettings.ContrastProgressBarEnabled) {
            ContrastProgress.createContrastTimeline();
        }
    },

    createContrastTimeline: function (){
        ContrastProgress.cloneDivAppendTo("jsTimelineContainer", "jsTimelineContrast", "jsTimelineControlsCenter");
        $("#jsTimelineContrast").addClass("timeline-contrast");
        $("#jsTimelineProgressHover").addClass("timeline-contrast-hover");

        ContrastProgress.addFixedDiv();
    },

    cloneDivAppendTo: function (divId, newDivId, appendToDivID) {
        $('#' + divId).clone(true).prop('id', newDivId).appendTo('#' + appendToDivID);
    },

    addFixedDiv: function () {
        $("#jsTimelineContrast").wrapInner("<div id='jsTimelineContrastFixed'></div>");
        $("#jsTimelineContrastFixed").css('width', $("#jsTimelineContainer").width() + "px");
    },

    setContrastTimelineProgress: function (progress){
        $("#jsTimelineContrast").width($("#jsTimelineContainer").width() * progress);
    }
};

var KeyboardInputController = {

    initialise: function () {
        KeyboardInputController.initKeyboardControls();
        KeyboardInputController.hideOutlines();
    },

    hideOutlines: function () {
        $('a[href], area[href], input, select, textarea, button, iframe, object, embed, *[tabindex], *[contenteditable]')
            .not('[disabled]').removeClass('focusable').addClass('no-focus');
    },

    showOutlines: function () {
        $('a[href], area[href], input, select, textarea, button, iframe, object, embed, *[tabindex], *[contenteditable]')
            .not('[disabled]').removeClass('no-focus').addClass('focusable');
    },

    initKeyboardControls: function() {
        var keyStart = {37: null, 39: null};
        var keyEnd = {37: null, 39: null};

        //Add a listener on the body of videoPlayer.php
        $(document).keydown(function(e) {
            //Then, if the element in focus isn't an input, select, textarea or form, allow the user to control the video player
            var inputActive = $("input, select, textarea, form").is(":focus");
            var currentDate = new Date();

            if(inputActive === false) {
                switch (e.keyCode) {
                    //Space bar
                    case 32:
                        e.preventDefault();
                        if (VideoPlayerInterface.iframeWindow.rtc.player.video.status().paused) {
                            VideoPlayerInterface.iframeWindow.rtc.player.controls.resume();
                        } else {
                            VideoPlayerInterface.iframeWindow.rtc.player.controls.pause();
                        }

                        VideoPlayerInterface.iframeWindow.rtc.utils.track("keyboard.spacebar");
                        break;
                    //Left and right arrow keys
                    case 37:
                    case 39:
                        //Record the time the keypress started
                        if(keyStart[e.keyCode] === null) {
                            keyStart[e.keyCode] = new Date();
                        }

                        //Then if the current time is a second after the key press started, rewind or fast-forward the video
                        if(currentDate.getTime() > keyStart[e.keyCode].getTime() + 500) {
                            if(VideoPlayerInterface.iframeWindow.rtc.player.vars.videoDuration !== 0 && VideoPlayerInterface.iframeWindow.rtc.player.vars.videoDuration < 10) {
                                if(e.keyCode == 37) {
                                    VideoPlayerInterface.iframeWindow.rtc.player.skipPrevious();
                                    VideoPlayerInterface.iframeWindow.rtc.utils.track("keyboard.skip-previous");
                                } else {
                                    VideoPlayerInterface.iframeWindow.rtc.player.skipNext();
                                    VideoPlayerInterface.iframeWindow.rtc.utils.track("keyboard.skip-next");
                                }
                            } else if(VideoPlayerInterface.iframeWindow.rtc.player.vars.videoDuration !== 0) {
                                if(e.keyCode == 37) {
                                    VideoPlayerInterface.iframeWindow.rtc.player.vars.currentTime -= 10;
                                    VideoPlayerInterface.iframeWindow.rtc.utils.track("keyboard.rewind", "newTime=" + rtc.player.vars.currentTime);
                                } else {
                                    VideoPlayerInterface.iframeWindow.rtc.player.vars.currentTime += 10;
                                    VideoPlayerInterface.iframeWindow.rtc.utils.track("keyboard.fast-forward", "newTime=" + rtc.player.vars.currentTime);
                                }

                                //Limiting the percentage to 99.9% as 100% seems to break the rewind/fast-forward functionality
                                var percent = Math.min((VideoPlayerInterface.iframeWindow.rtc.player.vars.currentTime / VideoPlayerInterface.iframeWindow.rtc.player.vars.videoDuration) * 100, 99.9);
                                VideoPlayerInterface.iframeWindow.rtc.timeline.slideCurrentState(RTCVisit.currentState, null, percent);
                            }
                        }
                        break;
                    // Enter key
                    case 13:
                        if (document.activeElement.type !== 'button'){
                            $(document.activeElement).click();
                        }
                        break;
                    // Tab key
                    case 9:
                        KeyboardInputController.showOutlines();
                        break;
                }
            }
        });

        $(document).keyup(function(e) {
            //If the element in focus isn't an input, select, textarea or form, allow the user to control the video player
            var inputActive = $("input, select, textarea, form").is(":focus");
            var currentDate = new Date();

            if(inputActive === false) {
                switch (e.keyCode) {
                    //Left and right arrow keys
                    case 37:
                    case 39:
                        keyStart[e.keyCode] = null;

                        //If the user has pressed an arrow key twice, skip the section
                        if(keyEnd[e.keyCode] !== null) {
                            if(e.keyCode == 37 && currentDate.getTime() < keyEnd[37].getTime() + 1000) {
                                VideoPlayerInterface.iframeWindow.rtc.player.skipPrevious();
                                VideoPlayerInterface.iframeWindow.rtc.utils.track("keyboard.skip-previous");
                            } else if(e.keyCode == 39 && currentDate.getTime() < keyEnd[39].getTime() + 1000) {
                                VideoPlayerInterface.iframeWindow.rtc.player.skipNext();
                                VideoPlayerInterface.iframeWindow.rtc.utils.track("keyboard.skip-next");
                            }
                        }

                        //Record the time the keyup started
                        if(keyEnd[e.keyCode] === null || currentDate.getTime() >= keyEnd[e.keyCode].getTime() + 1000) {
                            keyEnd[e.keyCode] = new Date();
                        }
                        break;
                }
            }
        });
    }
};
/**
 * All the possible language settings that must be accounted for
 */
var startingLanguage = "en";

var LanguageSelector = {

    currentLanguageCode: 'en',
    currentLanguageObj: {},
    /**
     * Initialise the language selector
     */
    initialise: function(startingLanguage) {
        // Events for language selector
        LanguageSelector.events.initialise();

        // Starting value
        if (typeof startingLanguage == 'undefined') {
            startingLanguage = LanguageSelector.getStartingLanguage();
        }
        LanguageSelector.loadLanguageJSON(startingLanguage);
        LanguageSelector.setLanguage(startingLanguage);
    },

    getStartingLanguage: function(){
        if(window.location.search.search(/language=[a-z][a-z]/) != -1){
            var langArray = window.location.search.match(/language=[a-z][a-z]/);
            var langCode = langArray[0].replace("language=", '');
            return langCode;
        } else {
            return startingLanguage;
        }
    },

    /**
     * Set language with one of the values from LanguageSettings
     *
     * @param value
     */
    setLanguage: function(langCode) {
        $('.jsTimelineSettingsLanguage').each(function() {
            if ($(this).data('language') === langCode) {
                LanguageSelector.currentLanguageCode = $(this).data('language');
                $(this).find('.jsSelectedLanguage').show();
            } else {
                $(this).find('.jsSelectedLanguage').hide();
            }
        });
    },

    loadLanguageJSON: function(langCode){
        var langFileUrl = "./language/" + langCode + ".json";
        $.getJSON(langFileUrl,function (json) {
            LanguageSelector.currentLanguageObj = json;
            LanguageSelector.updateLanguage(langCode);
        });
    },

    updateLanguage: function(langCode) {
        //Change the text of every .translate element to current language
        $(".translate").each(function () {
            var translateId = $(this).data('translate');
            if(LanguageSelector.currentLanguageObj.hasOwnProperty(translateId)){
                $(this).text(LanguageSelector.currentLanguageObj[translateId]);
                if($(this).parent().attr('title')){
                    $(this).parent().attr('title',LanguageSelector.currentLanguageObj[translateId]);
                }
            }
        });

        //Changes the source of the side buttons and promos to language specific sources
        LanguageSelector.updateImages();

        //Updates the lang tag at the top of the index.php html tag
        LanguageSelector.updateLangTag(LanguageSelector.currentLanguageCode);

        //Change StateMap to correct language
        VideoPlayerInterface.updateStateMap(LanguageSelector.currentLanguageObj.ChapterSettings);

        //Change CTA buttons to correct language
        if(LanguageSelector.currentLanguageObj.CtaButtonSettings){
            CtaButtons.SettingsJsonObject = LanguageSelector.currentLanguageObj.CtaButtonSettings;
        }

        /*
        * If the iframe is present and its src path already contains language=xx
        * then replace the lang code with new code else append the language parameter to iframe src url
        */
        if (document.getElementById('videoPlayerIframe') != null) {
            var videoUrl = document.getElementById('videoPlayerIframe').src;

            if (videoUrl.search(/language=[a-z][a-z]/) != -1){
                videoUrl = document.getElementById('videoPlayerIframe').src.replace(/language=../,"language=" + langCode );
            } else {
                videoUrl += '&language=' + langCode;
            }

            document.getElementById('videoPlayerIframe').src = videoUrl;
        }
    },

    updateLangTag: function(newLangCode){
        $('html').attr('lang', newLangCode);
    },

    updateImages: function () {
        var json = LanguageSelector.currentLanguageObj;
        if(json.CtaButtonsImagePath && json.CtaButtonsImagePathIE){
            $(".jsCtaIcon").css('background-image', "url(" + json.CtaButtonsImagePath + ")");
            $(".lteie8 .jsCtaIcon").css('background-image', "url(" + json.CtaButtonsImagePathIE + ")");
        }

        if(json.PromoDesktopTopImagePath && json.PromoDesktopTopImagePathIE) {
            $("#jsPromoDesktopTop").css('background-image', "url(" + json.PromoDesktopTopImagePath + ")");
            $(".lteie8 #jsPromoDesktopTop").css('background-image', "url(" + json.PromoDesktopTopImagePathIE + ")");
        }

        if(json.PromoDesktopBottomImagePath && json.PromoDesktopBottomImagePathIE) {
            $("#jsPromoDesktopBottom").css('background-image', "url(" + json.PromoDesktopBottomImagePath + ")");
            $(".lteie8 #jsPromoDesktopBottom").css('background-image', "url(" + json.PromoDesktopBottomImagePathIE + ")");
        }

        if(json.PromoMobileTopImagePath && json.PromoMobileTopImagePathIE) {
            $("#jsPromoMobileTop").css('background-image', "url(" + json.PromoMobileTopImagePath + ")");
            $(".lteie8 #jsPromoMobileTop").css('background-image', "url(" + json.PromoMobileTopImagePathIE + ")");
        }

        if(json.PromoMobileBottomImagePath && json.PromoMobileBottomImagePathIE) {
            $("#jsPromoMobileBottom").css('background-image', "url(" + json.PromoMobileBottomImagePath + ")");
            $(".lteie8 #jsPromoMobileBottom").css('background-image', "url(" + json.PromoMobileBottomImagePathIE + ")");
        }
    },

    getTextByKey: function (key) {
        if(typeof LanguageSelector.currentLanguageObj[key] === 'string'){
            return LanguageSelector.currentLanguageObj[key];
        }
        return false;
    },

    /**
     * Define the events
     */
    events: {
        /**
         * Link up the events and the event handlers
         */
        initialise: function() {
            $('#jsLanguageMenuTitle').click(LanguageSelector.events.closeLanguageMenu);
            $('.jsTimelineSettingsLanguage').click(LanguageSelector.events.languageItemClickEventHandler);
        },

        closeLanguageMenu: function (e) {
            $('#jsSettingsButtonPopout').show();
            $('#jsLanguageSelectorPopout').hide();
            $("#jsLangMenuItem").focus();
        },

        languageItemClickEventHandler: function(e) {
            var newLang = $(this).data('language');
            LanguageSelector.loadLanguageJSON(newLang);
            LanguageSelector.setLanguage(newLang);
            ClosedCaptionSelector.setClosedCaptions('off');
        }
    }
};

var Promos = {

    SettingsJsonObject: {},

    initialise: function (settings) {
        Promos.SettingsJsonObject = settings;
        Promos.events.initialise();
    },

    promos: {
        promo1: function() {
            VideoPlayerInterface.actions.pause();

            // Log the click event
            VideoPlayerInterface.iframeWindow.rtc.utils.track(
                "promo.click",
                JSON.stringify(Promos.SettingsJsonObject.promo1)
            );

            // Open the URL in a new window
            window.open(Promos.SettingsJsonObject.promo1.url, '_blank');
        },

        promo2: function() {
            VideoPlayerInterface.actions.pause();

            // Log the click event
            VideoPlayerInterface.iframeWindow.rtc.utils.track(
                "promo.click",
                JSON.stringify(Promos.SettingsJsonObject.promo2)
            );

            // Open the URL in a new window
            window.open(Promos.SettingsJsonObject.promo2.url, '_blank');
        }
    },

    events: {
        initialise: function () {
            $('.jsPromoContainer a').click(Promos.events.click);
        },

        click: function(e) {
            Promos.promos[$(this).data('promo')]();
        }
    }
};

/**
 * All the possible quality settings that must be accounted for
 */
var QualitySettings = {
    AUTO : "auto",
    LOW : "360p",
    MEDIUM : "540p",
    HIGH : "720p",
    FULL_HD : "1080p"
}

var QualitySelector = {
    /**
     * Initialise the quality selector
     */
    initialise: function(startingQuality) {
        if (VideoPlayerInterface.iframeWindow.rtc != null && VideoPlayerInterface.iframeWindow.rtc.player.quality.getLastResolution() != null) {
            QualitySelector.loaded = true;

            // Events for quality selector
            QualitySelector.events.initialise();

            QualitySelector.showEnabledResolutions();

            // Set initial state.
            QualitySelector.removeItemSelection();
            if (VideoPlayerInterface.iframeWindow.rtc.player.quality.getAuto()) {
                QualitySelector.setAutoTrue();
            } else {
                QualitySelector.setSelected(VideoPlayerInterface.iframeWindow.rtc.player.quality.getSelected());
            }

            // Update auto selected resolution during playback.
            VideoPlayerInterface.iframeWindow.rtc.events.subscribe('player.quality.lastResolution', function (e, data) {
                if (VideoPlayerInterface.iframeWindow.rtc.player.quality.getAuto()) {
                    QualitySelector.removeItemSelection();
                    $("#jsQualityAutoTick").show();
                    QualitySelector.setButtonHd(data.lastResolution);
                }
            });
        }
    },

    loaded: false,

    setButtonHd: function(quality) {
        var hdOn = VideoPlayerInterface.iframeWindow.rtc.player.quality.isHd(quality);
        $settingsBtn = $("#jsSettingsButtonIcon");
        $qualityIcon = $("#jsQualityMenuIcon, #jsQualityMenuAutoIcon");

        if (hdOn) {
            $settingsBtn.addClass('timeline__button-icon--settings--hd');
            $qualityIcon.addClass('timeline__button-icon--hd');

            $settingsBtn.removeClass('timeline__button-icon--settings--sd');
            $qualityIcon.removeClass('timeline__button-icon--sd');
        } else {
            $settingsBtn.addClass('timeline__button-icon--settings--sd');
            $qualityIcon.addClass('timeline__button-icon--sd');

            $settingsBtn.removeClass('timeline__button-icon--settings--hd');
            $qualityIcon.removeClass('timeline__button-icon--hd');
        }
    },

    setAutoTrue: function() {
        $("#jsQualityAutoTick").show();

        var last = VideoPlayerInterface.iframeWindow.rtc.player.quality.getLastResolution();
        if (typeof last === "string") {
            QualitySelector.setButtonHd(last);
        }
    },

    setSelected: function(quality) {
        $("#jsQuality" + quality + "Tick").show();
        QualitySelector.setButtonHd(quality);
    },

    removeItemSelection: function() {
        $("#jsQualityAutoTick").hide();

        for (var quality in QualitySettings) {
            $("#jsQuality" + QualitySettings[quality] + "Tick").hide();
        }
    },

    showEnabledResolutions: function() {
        // Show only enabled resolutions.
        var show = VideoPlayerInterface.iframeWindow.rtc.player.quality.getAvailable();
        $(".jsTimelineSettingsQuality").each(function(i, el) {
            var $el = $(el);
            var res = $el.data('quality');
            if ($.inArray(res, show) === -1 && res !== 'auto') {
                $el.hide();
            }
        });
    },

    /**
     * Define the events for the quality selector
     */
    events: {
        /**
         * Link up the events and the event handlers
         */
        initialise: function() {
            $(".jsTimelineSettingsQuality").click(QualitySelector.events.selectQuality);
        },

        selectQuality: function(e) {
            var qualityButton = $(this);
            var quality = qualityButton.data("quality");

            QualitySelector.removeItemSelection();
            if (quality == "auto") {
                VideoPlayerInterface.iframeWindow.rtc.player.quality.setAutoTrue();
                QualitySelector.setAutoTrue();
            } else {
                VideoPlayerInterface.iframeWindow.rtc.player.quality.setSelected(quality);
                QualitySelector.setSelected(quality);
            }
        },

        closeQualityMenu: function (e) {
            $('#jsSettingsButtonPopout').show();
            $('#jsQualitySelectorPopout').hide();
            $("#jsQualityMenuItem").focus();
        }
    }
};

var SettingsPanel = {

    initMenu: function() {
        $("#jsQualityMenuTitle").click(QualitySelector.events.closeQualityMenu);

        if (!Timeline.SettingsJsonObject.ClosedCaptionsSupported) {
            $('#jsCCMenuItem').remove();
        }

        if (!Timeline.SettingsJsonObject.MultiLanguageSupported) {
            $('#jsLangMenuItem').remove();
        }

        SettingsPanel.events.initialise();
    },

    events: {
        /**
         * Link up the events and the event handlers
         */
        initialise: function() {
            $('#jsLangMenuItem').click(SettingsPanel.events.settingsItemClickHandler);
            $('#jsCCMenuItem').click(SettingsPanel.events.settingsItemClickHandler);
            $('#jsQualityMenuItem').click(SettingsPanel.events.settingsItemClickHandler);
            $('#jsSettingsButton').click(SettingsPanel.events.settingsButtonClickEventHandler);

            $(document).on("click touchstart", SettingsPanel.events.documentClickEventHandler);
        },

        /**
         * Display the quality selector control when the user hovers over the settings icon
         */
        settingsButtonClickEventHandler: function(e) {
            var popout = $('#jsSettingsButtonPopout');
            if ($('#jsCCSelectorPopout').is(':visible') || $('#jsQualitySelectorPopout').is(':visible') ||
                    $('#jsLanguageSelectorPopout').is(':visible') || popout.is(':visible')){
                $('#jsCCSelectorPopout').hide();
                $('#jsQualitySelectorPopout').hide();
                $('#jsLanguageSelectorPopout').hide();
                popout.hide();
            } else {
                popout.show();
            }
        },

        settingsItemClickHandler: function(e) {
            var setting = $(this).data("setting");
            switch (setting) {
                case "language":
                    $('#jsLanguageSelectorPopout').show();
                    $('#jsSettingsButtonPopout').hide();
                    return;
                case "quality":
                    $('#jsQualitySelectorPopout').show();
                    $('#jsSettingsButtonPopout').hide();
                    return;
                case "closed-captions":
                    $('#jsCCSelectorPopout').show();
                    $('#jsSettingsButtonPopout').hide();
                    return;

            }
        },

        documentClickEventHandler: function(e) {
            if (e.target.id !== "jsSettingsButton" && $(e.target).parents("#jsSettingsContainer, #jsSettingsButton").length === 0) {
                $("#jsSettingsButtonPopout").hide();
                $("#jsCCSelectorPopout").hide();
                $("#jsQualitySelectorPopout").hide();
                $("#jsLanguageSelectorPopout").hide();
            }
        }
    }
};

var SocialIcons = {
    settings: {},
    icons: {},

    initialise: function(settings) {
        SocialIcons.settings = settings;
        SocialIcons.icons = settings.icons;

        SocialIcons.initIcons();
        SocialIcons.events.initialise();
    },

    initIcons: function() {
        var socialIconHtml = SocialIcons.generateHtml();

        if (SocialIcons.settings.position === "left") {
            $("#jsSocialIconsTop").addClass("social--top-left");
            $("#jsSocialIconsTop").append(socialIconHtml);
        } else {
            $("#jsSocialIconsTop").addClass("social--top-right");
            $("#jsSocialIconsTop").prepend(socialIconHtml);
        }

        $("#jsSocialIconsBottom").prepend(socialIconHtml);
    },

    generateHtml: function() {
        var html = "";

        $.each(SocialIcons.icons, function(key, icon) {
            html += '<button class="social__icon social__icon--' + key + '" data-icon="' + key + '" tabindex="5">';
            html += '<span class="sr-only translate" data-translate="SocialIcon-' + key + '">' + icon.text + '</span>';
            html += '</button>';
        });

        return html;
    },

    /**
     * Define the events for the social icons
     */
    events: {
        initialise: function() {
            $("#jsSocialIconTopCollapse").click(SocialIcons.events.toggleTop);
            $("#jsSocialIconTopExpand").click(SocialIcons.events.toggleTop);

            $(".jsSocialIcons button").click(SocialIcons.events.click);
        },

        toggleTop: function(e) {
            $("#jsSocialIconTopCollapse").toggle();
            $("#jsSocialIconTopExpand").toggle();
            $("#jsSocialIconsTop").toggleClass("social--expanded social--collapsed");
        },

        click: function(e) {
            var icon = SocialIcons.icons[$(this).data("icon")];

            if (icon && icon.url) {
                VideoPlayerInterface.actions.pause();
                VideoPlayerInterface.iframeWindow.rtc.utils.track("socialicon.click", icon);
                window.open(icon.url, "_blank");
            }
        }
    }
};

var CtaButtons = {

    SettingsJsonObject: {},

    pausedOnOpen: false,

    initialise: function (settings) {
        CtaButtons.SettingsJsonObject = settings;
        CtaButtons.events.initialise();
    },

    buttonClick: function(buttonName) {
        var button = CtaButtons.SettingsJsonObject[buttonName];

        if (button) {
            if (button.hasOwnProperty("card")) {
                if (CtaButtons.isCardOpen(buttonName)) {
                    CtaButtons.closeSideCard(buttonName, true);
                } else {
                    CtaButtons.openSideCard(buttonName);
                }
            } else if (button.hasOwnProperty("url")) {
                VideoPlayerInterface.actions.pause();
                VideoPlayerInterface.iframeWindow.rtc.utils.track("sidebutton.click", buttonName);
                window.open(button.url, '_blank');
            }
        }
    },

    /**
     * Display the side card, closing any open interaction cards or pausing the video
     */
    openSideCard: function(buttonName) {
        CtaButtons.closeAllSideCards();

        VideoPlayerInterface.hideResumeSplash();

        VideoPlayerInterface.iframeWindow.rtc.utils.track("sidebutton.click", buttonName);

        // Hide any interaction cards in the video and show the side card overlay instead
        //VideoPlayerInterface.iframeWindow.closeAllOtherCards();

        // The function above should be defined in your project's common javascript
        // in the Interactions Manager in the EOV Director.
        // Sample code is shown below:

        // window.cardsToReopen = [];
        // window.closeAllOtherCards = function() {
        //     $('.card').each(function(e) {
        //         if ($(this).is(":visible")) {
        //             window.cardsToReopen.push($(this));
        //             $(this).rtcCard("close")
        //         }
        //     });
        // };
        // window.reopenCards = function() {
        //     for (var i = 0; i < window.cardsToReopen.length; i++) {
        //         window.cardsToReopen[i].rtcCard("open");
        //     }
        //     window.cardsToReopen = [];
        // };

        CtaButtons.pausedOnOpen = !VideoPlayerInterface.isPlaying;

        VideoPlayerInterface.actions.pause(false);

        var cardId = CtaButtons.getCardIdForButton(buttonName);

        if (cardId != null) {
            VideoPlayerInterface.iframeWindow.$(cardId).rtcCard("open");
        }
    },

    /**
     * Close the side card, reopening any previously opened interaction cards or resuming the video
     */
    closeSideCard: function(buttonName, continueVideo) {
        var cardId = CtaButtons.getCardIdForButton(buttonName);

        if (cardId != null) {
            VideoPlayerInterface.iframeWindow.$(cardId).rtcCard("close");
        }

        // Re-open any interaction cards that were previously open
        // See code snippet and comments in "openSideCard" function above for examples of how to use this code
        // VideoPlayerInterface.iframeWindow.reopenCards();

        if (continueVideo && !CtaButtons.pausedOnOpen) {
            VideoPlayerInterface.actions.play();
        }
    },

    /**
     * Close all open side cards
     */
    closeAllSideCards: function() {
        for (var key in CtaButtons.SettingsJsonObject) {
            var button = CtaButtons.SettingsJsonObject[key];

            if (button.hasOwnProperty("card")) {
                CtaButtons.closeSideCard(key);
            }
        }
    },

    /**
     * Find out if the card associated with a particular cta button is currently "open"
     */
    isCardOpen: function(buttonName) {

        var cardId = CtaButtons.getCardIdForButton(buttonName);

        if (cardId != null) {
            return VideoPlayerInterface.iframeWindow.$(cardId + ":visible").length > 0;
        }

        return false;
    },

    /**
     * Gets the id (e.g. #card45rf66fd) of the card HTML element associated with a given cta button
     */
    getCardIdForButton: function(buttonName) {
        var button = CtaButtons.SettingsJsonObject[buttonName];

        if (button.hasOwnProperty("card")) {
            return "#card" + button.card;
        }

        return null;
    },

    /**
     * Define the events for the cta buttons
     */
    events: {
        initialise: function () {
            $('.jsCtaContainer button').click(CtaButtons.events.click);
        },

        click: function(e) {
            CtaButtons.buttonClick($(this).data('button'));
        }
    }
};

var Timeline = {

    SettingsJsonObject: {},

    progress: 0,

    /**
     * Initialise the timeline
     *
     * @var progress         {number} The initial time in seconds
     * @var timelineSettings {object} JSON object of settings for the timeline
     */
    initialise: function(progress, timelineSettings) {
        Timeline.loadSettings(timelineSettings);
        Timeline.events.initialise();
        Timeline.progress = progress;
        Timeline.update();

        // Disable fullscreen on IE10 and below
        // there is separate code in VideoPlayerInterface to handle iOS
        if (Timeline.isIe10OrBelow()) {
            Timeline.disableFullScreen();
        }
    },

    isIe10OrBelow: function() {
        return (navigator.userAgent.indexOf("Trident") !== -1 && navigator.userAgent.indexOf("rv:11") === -1) || navigator.appVersion.indexOf("MSIE 7.") != -1;
    },

    loadSettings: function(settings){
        Timeline.SettingsJsonObject = settings;
        SettingsPanel.initMenu();
        // If fullscreen is disabled in TimelineSettings remove the button.
        if (!Timeline.SettingsJsonObject.FullScreenEnabled) {
            Timeline.disableFullScreen();
        }
        BufferStatus.initBuffer();
    },

    disableFullScreen: function () {
        $('#jsFullScreenButton').remove();
        $('#jsTimelineControlsRight').addClass('timeline__controls--right-no-fs');
    },

    /**
     * Set the video progress along the timeline
     */
    setProgress: function(progress) {
        Timeline.progress = progress;
        Timeline.update();
    },

    /**
     * Get the video progress along the timeline
     */
    getProgress: function() {
        return Timeline.progress;
    },

    /**
     * Update the timeline
     */
    update: function() {
        var timelineWidth = $("#jsTimelineContainer").width(),
            progressWidth = timelineWidth * Timeline.getProgress(),
            ballWidth = 22;

        $("#jsTimelineProgress").width(progressWidth);

        /* On mobile devices, ensure the progress ball appears within the screen boundaries */
        if ($("#jsTimelineIndicator").is(":visible") && $("#jsTimelineCover").length === 0) {
            $("#jsTimelineIndicatorBall").show();
            $("#jsTimelineIndicator").width(Math.min(Math.max(progressWidth, ballWidth / 2), timelineWidth - ballWidth / 2));
        } else {
            $("#jsTimelineIndicatorBall").hide();
        }

        $("#jsTimelineContrastFixed").width(timelineWidth);
        ContrastProgress.setContrastTimelineProgress(Timeline.getProgress());
    },

    /**
     * Update the play/pause button to have the appropriate icon
     */
    updatePlayPauseButton: function() {
        if (VideoPlayerInterface.isPlaying) {
            $('#jsPlayPauseSRText').text('Pause');
            $('#jsPlayPauseButton span').removeClass('timeline__button-icon--play').addClass('timeline__button-icon--pause');
        } else {
            $('#jsPlayPauseSRText').text('Play');
            $('#jsPlayPauseButton span').removeClass('timeline__button-icon--pause').addClass('timeline__button-icon--play');
        }
    },

    /**
     * Remove the timeline cover element that blocks interaction before the video is loaded
     */
    enableTimelineIfNecessary: function() {
        if ($("#jsTimelineCover") && VideoPlayerInterface.isSourceSet) {
            $("#jsTimelineCover").remove();

            $(".jsTimelineButton").attr("tabindex", "1");
            $("#jsVolumeButton").attr("tabindex", "3");
            $("#jsFullScreenButton").attr("tabindex", "3");
        }
    },

    /**
     * Add timeline cover element that blocks interaction on video timeline bar
     */
    disableTimelineIfNecessary: function() {
        $('<div id="jsTimelineCover" class="timeline__cover"></div>').prependTo('#jsTimeline');
    },

    /**
     * Update the timeline state and progress
     */
    updateStateAndProgress: function(state, progress) {
        if (state == "END") {
            Timeline.setProgress(1);
            return;
        }

        if (Timeline.events.isDragging) {
            return;
        }

        progress = Timeline.calculateProgressInState(state, progress);

        var customErrorOpen = VideoPlayerInterface.iframeWindow.rtc.card.isFailoverMessageVisible();
        var stateTimelineElem = Timeline.getStateElementByName(state);
        var totalTimelinePercent = (parseFloat(stateTimelineElem.data('percent-start')) + (parseFloat(stateTimelineElem.data('percent-width')) * progress)) / 100;
        Timeline.setProgress(totalTimelinePercent);
        Timeline.updateMobileActiveState(stateTimelineElem);

        if (!customErrorOpen) {
            Timeline.enableTimelineIfNecessary();
        }
    },

    /**
     * Calculates the progress on the timeline based on the current state and the chapters within the video
     *
     * @param {string} state    Friendly name of the the state
     * @param {number} progress Video progress percentage as a fraction
     *
     * @return {number} Timeline progress
     */
    calculateProgressInState: function(state, progress) {
        var chapters = VideoPlayerInterface.getVideoChapters();

        if (progress > 0 && chapters && Object.keys(chapters).length > 1) {
            var videoDuration = VideoPlayerInterface.getVideoDuration(),
                actualState = VideoPlayerInterface.mapState(state),
                chapters = VideoPlayerInterface.getVideoChapters(),
                chapter = chapters[actualState];

            progress = (progress - (chapter.start / videoDuration)) / (chapter.duration / videoDuration);
        }

        return progress;
    },

    updateSeenChapterColors: function(){
        var currentProgress = Timeline.getProgress() * 100;
        $(".jsTimelineState").each(function (){
            var stateNameFriendly = $(this).data('state');
            var percentStart = parseFloat($(this).data('percent-start'));
            if (percentStart < currentProgress) {
                $(this).siblings(".jsTimelineChapterLabel").addClass("timeline-chapters--seen");
            }
        });
    },

    /**
     * Updates the active state on the timeline, which is shown on mobile devices
     */
    updateMobileActiveState: function(stateElem) {
        var stateLabelKey = $(stateElem).parent().find(".translate").data("translate");
        $("#jsTimelineMobileActiveState").text(LanguageSelector.getTextByKey(stateLabelKey));
    },

    /**
     * Get the timeline state from the video progress
     */
    getStateFromProgress: function(prettyState) {
        var pc_progress = Timeline.getProgress() * 100;
        var state = 'START';
        $('.jsTimelineState').each(function() {
            var start = parseFloat($(this).data('percent-start'));
            var end = parseFloat($(this).data('percent-start')) + parseFloat($(this).data('percent-width'));
            if (pc_progress >= start && pc_progress < end) {
                if (typeof prettyState != 'undefined' && prettyState) {
                    state = $(this).data('state');
                } else {
                    state = VideoPlayerInterface.StateMap[$(this).data('state')];
                }
            }
        });
        return state;
    },

    /**
     * Get the progress through the current state
     *
     * @param {Array.<Object>} chapters      Array of chapter details
     * @param {number}         videoDuration Video duration in seconds
     *
     * @return {number} Progress through the current state as a percentage
     */
    getProgressInState: function(chapters, videoDuration, progress) {
        var friendlyState = Timeline.getStateFromProgress(true),
            state = VideoPlayerInterface.mapState(friendlyState),
            stateTimelineElem = Timeline.getStateElementByName(friendlyState),
            progress = Timeline.getProgress(),
            stateStart = parseFloat(stateTimelineElem.data('percent-start')),
            stateWidth = parseFloat(stateTimelineElem.data('percent-width')),
            progressInState = ((progress * 100) - stateStart) / stateWidth;

        if (Object.keys(chapters).length == 1) {
            return progressInState;
        }

        return (chapters[state].start + (chapters[state].duration * progressInState)) / videoDuration;
    },

    /**
     * Get a state HTML element by it's friendly name
     */
    getStateElementByName: function(stateName) {
        var state = null;
        $('.jsTimelineState').each(function(key, value) {
            if (typeof stateName != 'undefined' && stateName == $(value).data('state')) {
                state = $(this);
            }
        });
        return state;
    },

    /**
     * Update the video
     */
    updateInVideo: function() {
        var state = Timeline.getStateFromProgress(),
            chapters = VideoPlayerInterface.getVideoChapters(),
            videoDuration = VideoPlayerInterface.getVideoDuration();

        if (state in chapters) {
            VideoPlayerInterface.actions.timelinePosition(Timeline.getProgressInState(chapters, videoDuration));
        } else {
            VideoPlayerInterface.actions.selectState(state);
        }
    },

    /**
     * Define the timeline events
     */
    events: {
        /**
         * Initialise events for timeline
         */
        initialise: function() {
            $('#jsTimelineContainer')
                .mousemove(Timeline.events.timelineMousemove)
                .mouseleave(Timeline.events.timelineMouseleave)
                .click(Timeline.events.timelineClick);

            $('#jsTimelineIndicator').click(Timeline.events.timelineClick);

            $('#jsTimelineIndicator')
                .mousedown(Timeline.events.timelineIndicatorMousedown);

            $(document)
                .mouseup(Timeline.events.documentMouseup)
                .mousemove(Timeline.events.documentMousemove);

            $(window).resize(Timeline.events.windowResize);

            $('#jsPlayPauseButton').click(Timeline.events.playPauseButtonClick);

            $('#jsSkipBackButton').click(Timeline.events.skipBack);

            $('#jsSkipForwardButton').click(Timeline.events.skipForward);

            $('#jsFullScreenButton').click(Timeline.events.toggleFullscreen);
        },

        isDragging: false,

        /**
         * Show faint background when hovering over timeline.
         */
        timelineMousemove: function(e) {
            $('#jsTimelineProgressHover').width(e.pageX - $('#jsTimelineProgress').offset().left);
        },

        /**
         * Hide faint background when leaving timeline.
         */
        timelineMouseleave: function() {
            $('#jsTimelineProgressHover').width(0);
        },

        /**
         * Handle the timeline click event
         */
        timelineClick: function(e) {
            e.preventDefault();
            var container = $('#jsTimelineIndicator');
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                var timeline_width = $('#jsTimelineContainer').width();
                Timeline.setProgress((e.pageX - $('#jsTimelineProgress').offset().left) / timeline_width);
                Timeline.updateInVideo();
            }
        },

        /**
         * Handle the timeline indicator mousedown event
         */
        timelineIndicatorMousedown: function(e) {
            e.preventDefault();
            Timeline.events.isDragging = true;
        },

        /**
         * Handle the document mouseup event
         */
        documentMouseup: function(e) {
            if (Timeline.events.isDragging) {
                e.preventDefault();
                Timeline.events.isDragging = false;
                Timeline.updateInVideo();
            }
        },

        /**
         * Handle the document mousemove event
         */
        documentMousemove: function(e) {
            if (Timeline.events.isDragging) {
                var timeline_width = $('#jsTimelineContainer').width();
                var e_location = e.pageX - $('#jsTimelineProgress').offset().left;
                if (e_location >= 0 && e_location <= timeline_width) {
                    Timeline.setProgress(e_location / timeline_width);
                }
            }
        },

        /**
         * Update the timeline when the window is resized
         */
        windowResize: function() {
            Timeline.update();
        },

        /**
         * Pause/play the video when the pause/play button is clicked
         */
        playPauseButtonClick: function() {
            if (VideoPlayerInterface.isPlaying) {
                VideoPlayerInterface.actions.pause();
            } else {
                VideoPlayerInterface.actions.play();
            }
        },

        /**
         * Skip back to the last state in the video
         */
        skipBack: function() {
            VideoPlayerInterface.actions.skipBack();
        },

        /**
         * Skip forward to the next state in the video
         */
        skipForward: function() {
            VideoPlayerInterface.actions.skipForward();
        },

        toggleFullscreen: function () {
            VideoPlayerInterface.iframeWindow.rtc.player.toggleFullscreen();
        }
    }
};

var VideoPlayerInterface = {
    iframeWindow: null,

    updateInterval: null,

    RTCVisit: {},

    isPlaying: false,

    isSourceSet: false,

    StateEngine: {},

    globalVolume: 0,

    currentState: '',

    firstRun: true,

    StateMap: {},

    /**
     * Initialise the video player interface.
     * This class is a proxy that handles all interaction with the video player itself
     */
    initialise: function(chapterSettings) {
        VideoPlayerInterface.updateStateMap(chapterSettings);

        try {
            VideoPlayerInterface.iframeWindow = document.getElementById("videoPlayerIframe").contentWindow;
            VideoPlayerInterface.updateFromVideo();
            VideoPlayerInterface.updateInterval = setInterval(function() {
                VideoPlayerInterface.updateFromVideo();
            }, 250);
        } catch(e) {
            console.log("Unable to initialise the VideoPlayerInterface.", e.message);
        }

        // Set a click handler on the resume splash screen
        $("#jsResumeSplash").click(function() {
            VideoPlayerInterface.actions.play();
        });

    },

    /**
     * Dynamically builds the StateMap based on the chapterSettings object parameter
     */
    updateStateMap: function(chapterSettings) {
        VideoPlayerInterface.StateMap = {};

        for (var chapterName in chapterSettings) {
            var chapter = chapterSettings[chapterName];

            for (var n in chapter) {
                var state = chapter[n];
                VideoPlayerInterface.StateMap[state.name] = state.cardId;
            }
        }

        // Always add an END state
        VideoPlayerInterface.StateMap["END"] = "END";
    },

    disableFullScreenOniOS: function() {
        var iosInlineFullscreenSupported = VideoPlayerInterface.iframeWindow.rtc.utils.iosInlineFullscreenSupported(document, navigator.userAgent, VideoPlayerInterface.iframeWindow.RTCConfig);
        var shouldHideFullscreenButton = VideoPlayerInterface.iframeWindow.rtc.utils.shouldHideFullscreenButton();
        if (shouldHideFullscreenButton && !iosInlineFullscreenSupported) {
            Timeline.disableFullScreen();
        }
    },

    /**
     * Get the latest video data and update all affected landing page elements.
     * This function fires at least once every second.
     */
    updateFromVideo: function() {
        try {
            if (VideoPlayerInterface.iframeWindow.rtc && VideoPlayerInterface.iframeWindow.rtc.player && VideoPlayerInterface.iframeWindow.rtc.player.playersReady()) {
                // Wait until the player is ready to initalise the quality selector
                if (!QualitySelector.loaded) {
                    QualitySelector.initialise();
                }

                if (VideoPlayerInterface.firstRun) {
                    var communication = iFrameCommunication();
                    communication.initialize();
                    VideoPlayerInterface.disableFullScreenOniOS();
                    VideoPlayerInterface.firstRun = false;
                }

                // Update state and timeline position
                VideoPlayerInterface.isSourceSet = VideoPlayerInterface.getSourceSet();
                VideoPlayerInterface.getStates();
                var times = VideoPlayerInterface.iframeWindow.rtc.player.getVideoTimes();
                Timeline.updateStateAndProgress(
                    VideoPlayerInterface.mapStateReverse(VideoPlayerInterface.currentState),
                    (times.play / times.status.duration) || 0
                );

                //Update Seen Chapters
                if(Timeline.SettingsJsonObject.SeenChaptersEnabled){
                    Timeline.updateSeenChapterColors();
                }

                //Update buffer Progress
                BufferStatus.updateBuffer();

                // Update is playing
                VideoPlayerInterface.isPlaying = (!times.status.paused);

                // Get data from video
                VideoPlayerInterface.getVisitData();

                // Update play pause
                Timeline.updatePlayPauseButton();

                // Update resume splash screen
                VideoPlayerInterface.toggleResumeSplash();

                // Update volume slider
                var globalVolumeFromVideo = VideoPlayerInterface.iframeWindow.globalVolume;
                if (VideoPlayerInterface.globalVolume != globalVolumeFromVideo) {
                    VideoPlayerInterface.globalVolume = globalVolumeFromVideo;
                    VolumeSlider.setVolume(globalVolumeFromVideo);
                }
            }
        } catch (exception) {
            if (window.console) {
                // NOTE: This line is only for debugging.
                // TODO: Comment out or remove the line below when deploying into production
                console.error(exception);
            }
        }

        // Update play pause
        Timeline.updatePlayPauseButton();

        // Update volume slider
        var globalVolumeFromVideo = VideoPlayerInterface.iframeWindow.globalVolume;
        if (VideoPlayerInterface.globalVolume != globalVolumeFromVideo) {
            VideoPlayerInterface.globalVolume = globalVolumeFromVideo;
            VolumeSlider.setVolume(globalVolumeFromVideo);
        }
    },

    /**
     * Gets the name property from data-dict-name. Updates prepared for text with name if exists
     */
    updatePreparedForName: function() {
        var preparedForText = LanguageSelector.getTextByKey("PreparedForText");
        var nameProperty = $("#jsPreparedForName").data("dict-name");
        var preparedName = VideoPlayerInterface.RTCVisit.videoVisitData[nameProperty];

        if (preparedName != null && preparedName.length > 0) {
            if ($("#jsPreparedFor").text() !== preparedForText) {
                $("#jsPreparedFor").text(preparedForText + " ");
            }

            if ($("#jsPreparedForName").text() !== preparedName) {
                $("#jsPreparedForName").text(preparedName);
            }
        }
    },

    /**
     * Get the video visit data
     */
    getVisitData: function() {
        VideoPlayerInterface.RTCVisit = VideoPlayerInterface.iframeWindow.RTCVisit;
        VideoPlayerInterface.updatePreparedForName();
    },

    /**
     * Get the video states
     */
    getStates: function() {
        VideoPlayerInterface.StateEngine = VideoPlayerInterface.iframeWindow.StateEngine;
        VideoPlayerInterface.currentState = VideoPlayerInterface.iframeWindow.rtc.state.currentState();
    },

    /**
     * Map a state name onto a state object
     */
    mapState: function(state) {
        if (typeof VideoPlayerInterface.StateMap[state] == 'undefined') {
            return VideoPlayerInterface.StateMap.START;
        }
        return VideoPlayerInterface.StateMap[state];
    },

    /**
     * Map a state object onto a state name
     */
    mapStateReverse: function(state) {
        var ret = '';
        $.each(VideoPlayerInterface.StateMap, function(key, val) {
            if (val == state) {
                ret = key;
            }
        });
        return ret;
    },

    /**
     * Get the source set
     */
    getSourceSet: function() {
        try {
            if (VideoPlayerInterface.iframeWindow.rtc.player.video.status().srcSet) {
                return true;
            }
        } catch (ex) {
        }

        return false;
    },

    /**
     * Toggle the resume splash screen that appears over the video when paused
     */
    toggleResumeSplash: function() {
        var resumeVisible = $("#jsResumeSplash").is(":visible");
        var aboutDialogVisible = VideoPlayerInterface.iframeWindow.$("#aboutModal").is(":visible");
        var times = VideoPlayerInterface.iframeWindow.rtc.player.getVideoTimes();
        var cardsOpen = VideoPlayerInterface.iframeWindow.rtc.card.isCardVisible();
        var customErrorOpen = VideoPlayerInterface.iframeWindow.rtc.card.isFailoverMessageVisible();

        if (!VideoPlayerInterface.isPlaying && !resumeVisible && !aboutDialogVisible && times.play > 0 && !cardsOpen && !customErrorOpen) {
            VideoPlayerInterface.showResumeSplash();
        } else if((VideoPlayerInterface.isPlaying || cardsOpen) && resumeVisible) {
            VideoPlayerInterface.hideResumeSplash();
        }
    },

    /**
     * Show the resume splash screen
     */
    showResumeSplash: function() {
        $("#jsResumeSplash").show();
    },

    /**
     * Hide the resume splash screen
     */
    hideResumeSplash: function() {
        $("#jsResumeSplash").hide();
    },

    /**
     * Gets details of the chapters of the current video
     *
     * @return {Array.<Object>} Array of chapter details (start time, duration etc)
     */
    getVideoChapters: function() {
        return VideoPlayerInterface.iframeWindow.rtc.timeline.vars.videoChapters;
    },

    /**
     * Gets the duration of the current video
     *
     * @return {number} Video duration in seconds
     */
    getVideoDuration: function() {
        return VideoPlayerInterface.iframeWindow.rtc.player.videoDuration();
    },

    /**
     * Define the actions for the video player interface
     */
    actions: {
        skipBack: function(currentState) {
            CtaButtons.closeAllSideCards();
            VideoPlayerInterface.hideResumeSplash();
            VideoPlayerInterface.iframeWindow.rtc.player.controls.rewind();
        },

        play: function() {
            CtaButtons.closeAllSideCards();
            VideoPlayerInterface.hideResumeSplash();
            VideoPlayerInterface.iframeWindow.rtc.player.controls.resume();
        },

        pause: function(showResumeSplash) {
            VideoPlayerInterface.iframeWindow.rtc.player.controls.pause();

            if(showResumeSplash !== false) {
                VideoPlayerInterface.showResumeSplash();
            }
        },

        skipForward: function(currentState) {
            CtaButtons.closeAllSideCards();
            VideoPlayerInterface.hideResumeSplash();
            VideoPlayerInterface.iframeWindow.rtc.player.controls.fastForward();
        },

        selectState: function(clickedState) {
            CtaButtons.closeAllSideCards();
            VideoPlayerInterface.hideResumeSplash();
            VideoPlayerInterface.iframeWindow.rtc.timeline.gotoState(clickedState);
        },

        timelinePosition: function(percentage) {
            CtaButtons.closeAllSideCards();
            VideoPlayerInterface.iframeWindow.$("#jquery_jplayer_videoplayer").jPlayer("playHead", percentage * 100);
        },

        volumeChange: function(vol) {
            try {
                if (isNaN(vol)) {
                    return;
                }

                if (
                    VideoPlayerInterface.iframeWindow
                    && VideoPlayerInterface.iframeWindow.rtc
                    && VideoPlayerInterface.iframeWindow.rtc.utils.storeLocal
                    && VideoPlayerInterface.iframeWindow.rtc.player.controls.changeVolume
                ) {
                    VideoPlayerInterface.iframeWindow.rtc.player.controls.changeVolume(vol);
                }
            } catch (exception) {
                if (window.console) {
                    console.error(exception); // TODO: change this line
                }
            }
        }
    }
};

var VolumeSlider = {
    /**
     * Initialise the volume slider
     */
    initialise: function(startingVolume) {
        // Events for volume slider
        VolumeSlider.events.initialise();

        // Starting value
        if (typeof startingVolume == 'undefined' || startingVolume > 1 || startingVolume < 0) {
            startingVolume = 0.5;
        }
        VolumeSlider.setVolume(startingVolume);
    },

    /**
     * Set volume with value between 0 and 1
     *
     * @param value
     */
    setVolume: function(value) {
        if (typeof value == 'undefined') {
            return;
        }

        var percent = value * 100;
        percent = percent > 100 ? 100 : percent;

        $('#jsVolumeLevel').width(percent + '%');
        $('#jsVolumeButtonSRText').text('Volume (' + Math.round(percent) + '%)');

        try {
            if (VideoPlayerInterface.actions.volumeChange){
                VideoPlayerInterface.actions.volumeChange(percent);
            }
        } catch (exception) {
            if (window.console) {
                console.error(exception);
            }
        }

        // Set volume logo bars
        if (value > 0.85){
            // 3 Bars
            VolumeSlider.setVolumeIconBars(3)
        } else if (value > 0.5) {
            // 2 bars
            VolumeSlider.setVolumeIconBars(2);
        } else if (value > 0.05) {
            // 1 bar
            VolumeSlider.setVolumeIconBars(1);
        } else {
            // no bars
            VolumeSlider.setVolumeIconBars(0);
        }
    },

    /**
     * Get the player volume between 0 and 1
     *
     * @returns {number}
     */
    getVolume: function() {
        return  $('#jsVolumeLevel').width() / $('#jsVolumeBar').width();
    },

    /**
     * Sets the volume image with either 0, 1 or 2 bars
     *
     * @param bars
     */
    setVolumeIconBars: function(bars) {
        $('#jsVolumeButtonIcon')
            .removeClass("timeline__button-icon--volume-0")
            .removeClass("timeline__button-icon--volume-1")
            .removeClass("timeline__button-icon--volume-2")
            .removeClass("timeline__button-icon--volume-3")
            .addClass('timeline__button-icon--volume-' + bars);
    },

    /**
     * Define the event handlers for the volume slider
     */
    events: {
        /**
         * Link up the events and the event handlers
         */
        initialise: function() {
            $('#jsVolumeButton').click(VolumeSlider.events.volumeButtonClickEventHandler);
            $('#jsVolumeBar').click(VolumeSlider.events.volumeLevelClick);
            $('#jsVolumeLevel').click(VolumeSlider.events.volumeLevelClick);
            $('#jsVolumeBall').mousedown(VolumeSlider.events.volumeBallMousedown);
            $(document).mouseup(VolumeSlider.events.documentMouseup)
                .mousemove(VolumeSlider.events.documentMousemove);
        },

        /**
         * Is the user currently dragging volume slider
         *
         * @type {boolean}
         */
        isDragging: false,

        /**
         * Muted Volume
         *
         * @type {number}
         */
        mutedVolume: 0,

        /**
         * Mute/unmute the volume
         */
        volumeButtonClickEventHandler: function(e) {
            // if volume is more than 0 then mute it, otherwise full volume
            if (VolumeSlider.getVolume() > 0) {
                // Store the volume before muting so we can revert back to the original value when we unmute
                VolumeSlider.mutedVolume = VolumeSlider.getVolume();
                VolumeSlider.setVolume(0);
            } else {
                // Revert back to the original volume value
                VolumeSlider.setVolume(VolumeSlider.mutedVolume);
            }
        },

        /**
         * Set the volume by clicking on the slider
         */
        volumeLevelClick: function(e) {
            var this_el = $('#jsVolumeBar');
            var container = $('#jsVolumeBall');
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                var widthOfBar = this_el.width();
                var pxFromLeftOfBar = e.pageX - this_el.offset().left;
                var newVol = (pxFromLeftOfBar / widthOfBar);
                VolumeSlider.setVolume(newVol);
            }
        },

        /**
         * Toggle drag state if we're dragging the slider, and hide the popup if
         * releasing the slider outside the popup area
         */
        documentMouseup: function(e) {
            if (VolumeSlider.events.isDragging) {
                e.preventDefault();
                VolumeSlider.events.isDragging = false;
            }
        },

        /**
         * Start dragging the volume slider ball
         */
        volumeBallMousedown: function(e) {
            e.preventDefault();
            VolumeSlider.events.isDragging = true;
        },

        /**
         * If dragging volume slider, adjust volume as necessary
         */
        documentMousemove: function(e) {
            if (VolumeSlider.events.isDragging) {

                var bar = $('#jsVolumeBar');
                var widthOfBar = bar.width();

                var pxFromLeftOfBar = e.pageX - bar.offset().left;
                if (pxFromLeftOfBar >= 0 && pxFromLeftOfBar <= widthOfBar) {
                    VolumeSlider.setVolume(pxFromLeftOfBar / widthOfBar);
                }
            }
        }
    }
};
var iFrameCommunication = function() {
    var object = {
        initialize: init
    };

    return object;

    /**
     * Initialize iFrame communication
     */
    function init() {
        try {
            if (VideoPlayerInterface.iframeWindow.rtc.utils.isPostMessageSupported()) {
                postMessageCommunication();
            } else {
                fallbackCommunication();
            }
        } catch(exception) {
            postMessageCommunication();
        }
    }

    //////////////////// PRIVATE //////////////////////

    /**
     * Add listener to post messages from rtc iFrame
     */
    function postMessageCommunication() {
        window.addEventListener("message", function(e) {
            switch (e.data.message) {
                case "showCustomError":
                    iFrameEvents.showErrorCard(e.data.data);
                    break;
                case "closeLowBandwidthCard":
                    iFrameEvents.closeLowBandwidthCard(e.data.data);
                    break;
                case "showLowBandwidthInfo":
                    iFrameEvents.showLowBandwidthInfo(e.data.data);
                    break;
            }
        }, false);
    }

    /**
     * Fake listener based on data attributes to support IE7 and other browsers which not supports window.postMessage
     */
    function fallbackCommunication() {
        var $postHandler = VideoPlayerInterface.iframeWindow.rtc.utils.$getIFrameListener();

        var interval = setInterval(function() {
            var message = $postHandler.data("message");
            var value = $postHandler.data("value");

            switch (message) {
                case "showCustomError":
                    iFrameEvents.showErrorCard(value);
                    resetPostHandler($postHandler);
                    break;
                case "closeLowBandwidthCard":
                    iFrameEvents.closeLowBandwidthCard(value);
                    resetPostHandler($postHandler);
                    break;
                case "showLowBandwidthInfo":
                    iFrameEvents.showLowBandwidthInfo(value);
                    resetPostHandler($postHandler);
                    break;
            }
        }, 250);
    }

    /**
     * Reset message and values from fake listener to prevent firing events in loop
     *
     * @param {object} $postHandler Jquery object with post handler element
     */
    function resetPostHandler($postHandler) {
        $postHandler.data("message", "");
        $postHandler.data("value", "");
    }
};

var iFrameEvents = {
    /**
     * Event occurs when custom error Card is activated
     *
     * @param {string} element Id or class element that exist in iFrame with error
     */
    showErrorCard: function(element) {
        var $elem = $(VideoPlayerInterface.iframeWindow.$(element));

        if ($elem.length > 0) {
            CtaButtons.closeAllSideCards();
            VideoPlayerInterface.hideResumeSplash();
            VideoPlayerInterface.actions.pause(false);
            Timeline.disableTimelineIfNecessary();
            $elem.show();
        }
    },
    /**
     * When low bandwidth card is close by button, show low bandwidth info under video
     *
     * @param {string} element Id or class element that exist in iFrame with error
     */
    closeLowBandwidthCard: function(element) {
        var $lowBandwidthBar = $(VideoPlayerInterface.iframeWindow.$(element));

        if ($lowBandwidthBar.length > 0) {
            $lowBandwidthBar.prependTo("#jsHeaderLowBandwidth");
        }

        Timeline.enableTimelineIfNecessary();
    },
    /**
     * When low bandwidth again will discover after turned off low bandwidh card show bottom message again
     *
     * @param {string} element Id or class element that should exist in iFrame with low bandwidth info
     */
    showLowBandwidthInfo: function(element) {
        var $lowBandwidthBar = $(element);

        if ($lowBandwidthBar.length > 0) {
            $(element).fadeIn();
        }
    }
};

var MobileOrientationHandler = {
    orientation: "portrait",

    /**
     * Initialises the MobileOrientationHandler
     */
    initialise: function() {
        if ($(window).height() <= $(window).width()) {
            MobileOrientationHandler.orientation = "landscape";
        } else {
            MobileOrientationHandler.orientation = "portrait";
        }

        MobileOrientationHandler.events.initialise();
        MobileOrientationHandler.resizeVideoArea();
    },

    /**
     * Checks whether the automatic scrolling/resizing of the video should be enabled.
     *
     * This check is performed using the visibility of the timeline indicator (only visible on tablet/mobile views)
     * and the device user agent.
     *
     * @return {boolean} true if the automatic scrolling/resizing should be enabled, otherwise false
     */
    shouldEnable: function() {
        return $("#jsTimelineIndicator").is(":visible") && navigator.userAgent.match(/Android|iPhone|Windows Phone|iPod/i);
    },

    /**
     * Automatically scrolls the window to the top of the video area
     */
    scrollToVideo: function() {
        if (MobileOrientationHandler.shouldEnable()) {
            $("html, body").animate(
                { scrollTop: $("#jsPlayerIframe").offset().top },
                1000
            );
        }
    },

    /**
     * Resizes the video/cta/timeline area to ensure it fits within a non 16/9 screen.
     */
    resizeVideoArea: function() {
        if ($(window).innerWidth() / $(window).innerHeight() > 16 / 9 && MobileOrientationHandler.shouldEnable()) {
            $("#jsMain").css("width", Math.ceil($(window).innerHeight() * (16 / 9)));
        } else {
            $("#jsMain").css("width", "");
        }
    },

    events: {
        /**
         * Initialises the events for the MobileOrientationHandler
         */
        initialise: function() {
            $(window).resize(MobileOrientationHandler.events.handleResize);
        },

        /**
         * Function called by the window.resize event
         */
        handleResize: function() {
            var height = $(window).height(),
                width = $(window).width();

            if (height <= width && MobileOrientationHandler.orientation === "portrait") {
                MobileOrientationHandler.orientation = "landscape";
                MobileOrientationHandler.scrollToVideo();
            } else if (height > width && MobileOrientationHandler.orientation === "landscape") {
                MobileOrientationHandler.orientation = "portrait";
            }

            MobileOrientationHandler.resizeVideoArea();
        }
    }
};
