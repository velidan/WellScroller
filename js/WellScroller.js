(function (window) {
    "use strict";

    function extend() {
        var i,
            key;
        for (i = 1; i < arguments.length; i++) {
            for (key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key)) {
                    arguments[0][key] = arguments[i][key];
                }
            }
        }
        return arguments[0];
    }

    var pluginName = "wellScroller",
        defaults = {
            axis: 'y',
            wheelSpeed: 40,
            wheelLock: true,
            touchLock: true,
            trackSize: false,
            thumbSize: false,
            thumbSizeMin: 20,
            marginTop: false,
            marginLeft: false,
            scrollDownBtn : null,
            scrollDownBtnStep: 4
        },
        wellScroller;

    function Plugin($container, options) {
        /**
         * The options of the scroller extend with the defaults.
         *
         * @property options
         * @type Object
         * @default defaults
         */
        this.options = extend({}, defaults, options);
        /**
         * @property _defaults
         * @type Object
         * @private
         * @default defaults
         */
        this._defaults = defaults;

        /**
         * @property _name
         * @type String
         * @private
         * @final
         * @default 'wellScroller'
         */
        this._name = pluginName;

       // It is used to identify a global variable. Which is actively used in nested functions.
       // $viewport -> our container with the visible part of scrolled content.
       // He is immutable and is often used in a variety of methods
        var self = this,
            $body = document.querySelector("body"),
            $viewport = searchInChildNode($container, 'viewport'),
            $overview = searchInChildNode($viewport, "overview"),
            $scrollbar = searchInChildNode($container, "scrollbar"),
            $thumb = searchInChildNode($scrollbar, "thumb"),
            $initialTransition = getComputedStyle($overview).transition,
            mousePosition = 0,
            isHorizontal = this.options.axis === 'x',
            posiLabel,
            sizeLabel = isHorizontal ? "width" : "height";


        if (isHorizontal) {
            posiLabel =  "left";
        } else {
            if (this.options.marginTop) {
                posiLabel = "margin-top";
            } else {
                posiLabel = "top";
            }

        }


        /**
         * If touch navigation
         *
         * @property touchControl
         * @type {boolean}
         * @default = false
         */
        this.touch = false;
        /**
         * The position of the content relative to the viewport.
         *
         * @property contentPosition
         * @type Number
         * @default 0
         */
        this.contentPosition = 0;

        /**
         * The height or width of the viewport.
         *
         * @property viewportSize
         * @type Number
         * @default 0
         */
        this.viewportSize = 0;

        /**
         * The height or width of the content.
         *
         * @property contentSize
         * @type Number
         * @default 0
         */
        this.contentSize = 0;

        /**
         * The ratio of the content size relative to the viewport size.
         *
         * @property contentRatio
         * @type Number
         * @default 0
         */
        this.contentRatio = 0;

        /**
         * The height or width of the content.
         *
         * @property trackSize
         * @type Number
         * @default 0
         */
        this.trackSize = 0;

        /**
         * The size of the track relative to the size of the content.
         *
         * @property trackRatio
         * @type Number
         * @default 0
         */
        this.trackRatio = 0;

        /**
         * The height or width of the thumb.
         *
         * @property thumbSize
         * @type Number
         * @default 0
         */
        this.thumbSize = 0;

        /**
         * The position of the thumb relative to the track.
         *
         * @property thumbPosition
         * @type Number
         * @default 0
         */
        this.thumbPosition = 0;

        /**
         * Will be true if there is content to scroll.
         *
         * @property hasContentToSroll
         * @type Boolean
         * @default false
         */
        this.hasContentToSroll = false;

        /**
         * Public
         * If we want to check and remove the dimension of overview and viewport. (Call from the outside)
         * @property checkContentsDimension
         * @type Boolean
         * @default false
         */
  /*      this.checkDimension = false;*/
   /**
         * Public
         * If we want to check and remove the dimension of overview and viewport. (Call from the outside)
         * @property checkContentsDimension
         * @type Boolean
         * @default null
         */
        this.typeScrollUpdate = null;

        /**
         * Public
         * Button "Show More" on sub - category
         * @property catShowMore
         * @type HTML element
         * @default null
         */
        this.catShowMore = null;


        /**
         * @method _initialize
         * @private
         */
        function _initialize() {
            self.update();
            _setEvents();
        }
        /**
         * You can use the update method to adjust the scrollbar to new content or to move the scrollbar to a certain point.
         *
         * @method update
         * @chainable
         * @param {Number|String} [scrollTo] Number in pixels or the values "relative" or "bottom". If you dont specify a parameter it will default to top
         */
        this.update = function (scrollTo) {
            var containerRule = getComputedStyle($container, null),
                sizeLabelCap = sizeLabel.charAt(0).toUpperCase() + sizeLabel.slice(1).toLowerCase(),
                scrcls = $scrollbar.className,
                scrollBarRules = getComputedStyle($scrollbar),
                scrollBarBorderSummary = +(scrollBarRules.borderTopWidth.substring(0, scrollBarRules.borderTopWidth.indexOf('px')))
                + +(scrollBarRules.borderBottomWidth.substring(0, scrollBarRules.borderBottomWidth.indexOf('px'))),
                containerRuleSize = (this.options.axis === 'x') ? +containerRule.width.replace(/px/, '') : +containerRule.height.replace(/px/, ''),

                scrollBarRule = getComputedStyle($scrollbar),
                scrollBarBorderSum = +scrollBarRule.borderTopWidth.replace(/px/, '') + +scrollBarRule.borderBottomWidth.replace(/px/, '');

            /* If our container have an auto or 100% size and we must use MaxHeight to set correct height */
            if ( containerRuleSize === '100%' || containerRule === 'auto' || containerRuleSize === 0 ) {
                containerRuleSize = (this.options.axis === 'x') ? containerRule.maxWidth.replace(/px/, '') : containerRule.maxHeight.replace(/px/, '');
            }


            $viewport.dataset.initSize = containerRuleSize;


           /* this.viewportSize = $viewport.dataset.initSize;*/
            this.viewportSize = containerRuleSize;


            this.contentSize = $overview['scroll' + sizeLabelCap];

            this.contentRatio = this.viewportSize / this.contentSize;
            this.trackSize = this.options.trackSize || this.viewportSize;
            this.trackSize -= scrollBarBorderSum;
            this.thumbSize = Math.min(this.trackSize, Math.max(this.options.thumbSizeMin, (this.options.thumbSize || (this.trackSize * this.contentRatio))));
            this.trackRatio = (this.contentSize - this.viewportSize) / (this.trackSize - this.thumbSize);
            this.trackDistance = this.viewportSize - scrollBarBorderSummary - this.thumbSize;
            this.hasContentToSroll = this.contentRatio < 1;




            scrcls = scrcls.replace(/\s?disable\s?/g, "");
            if (!this.hasContentToSroll) { scrcls += ' disable'; }
            $scrollbar.className = scrcls;

            scrollDownBtn(this.contentSize);

            switch (scrollTo) {
            case "bottom":
                this.contentPosition = Math.max(this.contentSize - this.viewportSize, 0);
                break;

            case "relative":
                this.contentPosition = Math.min(Math.max(this.contentSize - this.viewportSize, 0), Math.max(0, this.contentPosition));
                break;

            default:

                switch (this.typeScrollUpdate) {

                    //when we need just update and we not will watching for "ShowMore Btn" position
                    case "simpleUpdate" :
                        _removeDimension();
                        break;

                    //when we update and will watching for "ShowMore Btn" position and re-calculate content pos
                    case "oppositeCat" :
                        _calculateBarPosFromCat();
                        break;

                    default :
                        this.contentPosition = parseInt(scrollTo, 10) || 0;
                        break;
                }

            }

            /* if content grows and we want to keep overview vindow at current position */
            this.thumbPosition = self.contentPosition / self.trackRatio;

            _setCss();
            $container.dataset.scroller = 'enable';
        };

        /**
         * Just sugar on call updateScroller with checkDimension (hold scrollbar)
         */
        this.updateAndfixScrollBar = function () {
            if (this.typeScrollUpdate !== "simpleUpdate") {
                this.typeScrollUpdate = "simpleUpdate";
            }
            this.update();
        };

        /**
         * Calculate content dimension from bottom of content container
         * @private
         */
        function _removeDimension() {
            if ($overview.getBoundingClientRect().bottom < $viewport.getBoundingClientRect().bottom) {
                var dimension = $viewport.getBoundingClientRect().bottom - $overview.getBoundingClientRect().bottom;
                $overview.style.transition = 'all 0s';
                self.contentPosition = self.contentPosition - dimension;
            } else {
                self.contentPosition = parseInt(scrollTo, 10) || self.contentPosition;
            }
        }


        /**
         *  Just sugar on call updateScroller with checkDimension (hold scrollbar)
         *  Update and keep scrollbar opposite to showed category name
         *  @param buttonMoreElem {Object} -> subCategory button more (need for get category name position)
         */
        this.updateCategoryScroll = function (buttonMoreElem) {
            if (this.typeScrollUpdate !== "oppositeCat") {
                this.typeScrollUpdate = "oppositeCat";
            }

            if (buttonMoreElem) {this.catShowMore = buttonMoreElem;}

            this.update();
        };

        /**
         * Get bar position value from category name position
         * @private
         */
        function _calculateBarPosFromCat() {
            var /*showMoreParentH = self.catShowMore.parentNode.offsetHeight,*/
                //showMoreBtnTopPos = $(self.catShowMore).position().top,
                showMoreBtnTopPos = $(self.catShowMore.parentNode).position().top,
                moreBtnPosFromOverviewTop = showMoreBtnTopPos - self.contentPosition;

            // if showMoreBtn upper than overview bottom line
            if (moreBtnPosFromOverviewTop < 0) {
                //self.contentPosition += moreBtnPosFromOverviewTop - showMoreParentH;
                self.contentPosition += moreBtnPosFromOverviewTop;
            }

        }

        /**
         * @method _setCss
         * set css to scroller interface elems
         * @private
         */
        function _setCss() {
            $thumb.style[posiLabel] = self.thumbPosition + "px";
            $overview.style[posiLabel] = -self.contentPosition + "px";
            $scrollbar.style[sizeLabel] = self.trackSize + "px";
            $thumb.style[sizeLabel] = self.thumbSize + "px";
        }

        /**
         * @method _setEvents
         * @private
         */
        function _setEvents() {
            $viewport.ontouchstart = function (event) {
                if (1 === event.touches.length) {
                    self.touch = true;
                    _start(event.touches[0]);
                    event.stopPropagation();
                }
            };
            $thumb.ontouchstart = function (event) {
                event.stopPropagation();
                _start(event.touches[0]);
            };
            $scrollbar.ontouchstart = function (event) {
                self.touchScrollbar = true;
                _start(event, true);
            };

            $thumb.onmousedown = function (event) {
                event.stopPropagation();
                _start(event);
            };

            $scrollbar.onmousedown = function (event) {
                _start(event, true);
            };
            window.addEventListener("resize", function () {
                self.update("relative");
            }, true);

            $container.addEventListener('wheel', _wheel, false);

        }

        /**
         * @method _isAtBegin
         * @private
         */
        function _isAtBegin() {
            return self.contentPosition > 0;
        }

        /**
         * @method _isAtEnd
         * @private
         */
        function _isAtEnd() {
            return self.contentPosition <= (self.contentSize - self.viewportSize) - 5;
        }

        /**
         * @method _return initial transition to overview elem
         * @private
         */
        function _returnOverviewTransition() {
            $overview.style.transition = $initialTransition;
        }

        /**
         * @method _if current overviewHeight === initial val contentSize
         * @private
         */
        function _checkContentSize() {
          var currentOverviewH = $overview.scrollHeight;
            if (self.contentSize !== currentOverviewH) {
                self.update();
            }
        }

        /**
         * @method _start
         * @private
         * @param [event]
         * @param [gotoMouse] boolean. Move thumb to mouse posi or not
         */
        function _start(event, gotoMouse) {
           /* $body.classList.add('wellNoSelect');*/

            _checkContentSize();

            _returnOverviewTransition();
            if (self.hasContentToSroll) {
                var topToBoundRect;

                if (posiLabel === 'margin-top' || posiLabel === 'top') {topToBoundRect = 'top'; } //get coords from the getBoundRect
                if (posiLabel === 'margin-left' || posiLabel === 'left') {topToBoundRect = 'left'; } //get coords from the getBoundRect

                mousePosition = gotoMouse ? $thumb.getBoundingClientRect()[topToBoundRect] : (isHorizontal ? event.clientX : event.clientY);

                if (!$body.classList.contains("wellNoSelect")) {$body.classList.add("wellNoSelect");}

                document.ontouchmove = function (event) {

                    if (self.options.touchLock || (_isAtBegin() && _isAtEnd())) {
                        event.preventDefault();
                    }
                        _drag(event.touches[0]);
                };
                $thumb.ontouchmove = function (event) {
                    if (self.options.touchLock || (_isAtBegin() && _isAtEnd())) {
                        event.preventDefault();
                    }
                    _drag(event.touches[0]);
                };

                if (event.target.classList.contains("scrollbar")){
                    _drag(event, true);
                } else {
                    document.onmousemove = _drag;
                }
                document.onmouseup = $thumb.onmouseup = $thumb.ontouchend =  document.ontouchend = _end;
            }
        }

        /**
         * @method _wheel
         * @private
         */
        function _wheel(event) {

            if (self.options.axis !== 'x') {_checkContentSize();}

            _returnOverviewTransition();
            event.stopPropagation();
            if (self.hasContentToSroll) {
                var evntObj = event || window.event,
                    wheelSpeedDelta = -(evntObj.deltaY || evntObj.detail || (-1 / 3 * evntObj.wheelDelta)) / 40;

                if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
                    wheelSpeedDelta *= 20;
                }

                self.contentPosition -= wheelSpeedDelta * self.options.wheelSpeed;

                self.contentPosition = getContentPosi();
                self.thumbPosition = self.contentPosition / self.trackRatio;



               /* if animation lasts some time and height is not loaded yet, we give one more chance to get this*/
                if (self.trackDistance === 0) {self.trackDistance = $scrollbar.clientHeight - $thumb.clientHeight; }

                if (self.thumbPosition > self.trackDistance) {self.thumbPosition = self.trackDistance; }

                $thumb.style[posiLabel] = self.thumbPosition + "px";
                $overview.style[posiLabel] = -self.contentPosition + "px";

                if (self.options.wheelLock || (_isAtBegin() && _isAtEnd())) {
                    evntObj.preventDefault();
                }
            }
        }

        /**
         * @method _drag
         * @private
         */
        function _drag(event) {
            if (self.hasContentToSroll) {
                var mousePositionNew = isHorizontal ? event.clientX : event.clientY,
                    thumbPositionDelta = self.touch ? (mousePosition - mousePositionNew) : (mousePositionNew - mousePosition),
                    thumbPositionNew = Math.min((self.trackSize - self.thumbSize), Math.max(0, self.thumbPosition + thumbPositionDelta));

                if (self.trackDistance === 0) {self.trackDistance = $scrollbar.clientHeight - $thumb.clientHeight; }
                if (thumbPositionNew > self.trackDistance) {thumbPositionNew = self.trackDistance; }
                self.contentPosition = thumbPositionNew * self.trackRatio;

                $thumb.style[posiLabel] = thumbPositionNew + "px";
                $overview.style[posiLabel] = -self.contentPosition + "px";
            }
        }

        /**
         * function for scroll Down Button possibility
         * @param contentSize
         */
        function scrollDownBtn(contentSize) {
            var btn = self.options.scrollDownBtn,
                step = self.options.scrollDownBtnStep,
                resultShift = contentSize / step;
            if (btn) {

                btn.addEventListener('click', function () {
                    self.contentPosition += resultShift;
                    self.contentPosition = getContentPosi();
                    self.thumbPosition = self.contentPosition / self.trackRatio;

                    $overview.style[posiLabel] = -self.contentPosition + "px";
                    $thumb.style[posiLabel] = self.thumbPosition + "px";
                });
            }
        }

        /**
         * get content position
         * @returns {number}
         */
        function getContentPosi() {
            return Math.min((self.contentSize - self.viewportSize), Math.max(0, self.contentPosition));
        }

        /**
         * @method _end
         * @private
         */
        function _end() {
            self.thumbPosition = parseInt($thumb.style[posiLabel], 10) || 0;
            $body.className = $body.className.replace(" welNoSelect", "");
            document.onmousemove = document.onmouseup = null;
            $thumb.onmouseup = null;
            $scrollbar.onmouseup = null;
            document.ontouchmove = document.ontouchend = null;
            self.touch = false;
            if ($body.classList.contains('wellNoSelect')) {$body.classList.remove('wellNoSelect');}
			if ($body.getAttribute('class').trim().length === 0) {$body.removeAttribute('class');}
        }

        return _initialize();

    }

    /**
     *
     * @param elem
     * @param className
     * @returns {undefined}
     * search elem with needed className in childNodes of searchContext
     */
    function searchInChildNode(elem, className) {
        var resultElement;
        if (elem && elem.childNodes) {
            Array.prototype.slice.call(elem.childNodes).forEach(function (elem) {
                if (elem.nodeType !== 3) {
                    if (elem.classList.contains(className)) {
                        resultElement =  elem;
                    }
                }
            });
            if (resultElement !== undefined) {
                return resultElement;
            }
        }

    }

    /**
     * @class window.wellScroller
     * @constructor
     * @param {Object} [$container] Element to attach scrollbar to.
     * @param {Object} [options]
             * {String} [options.axis='y'] Vertical or horizontal scroller? ( x || y ).
     *  {Boolean} [options.wheelSpeed=40] How many pixels must the mouswheel scroll at a time.
     *  {Boolean} [options.wheelLock=true] Lock default window wheel scrolling when there is no more content to scroll.
     *  {Number} [options.touchLock=true] Lock default window touch scrolling when there is no more content to scroll.
     *  {Boolean|Number} [options.trackSize=false] Set the size of the scrollbar to auto(false) or a fixed number.
     *  {Boolean|Number} [options.thumbSize=false] Set the size of the thumb to auto(false) or a fixed number
     *  {Boolean}[options.thumbSizeMin=20] Minimum thumb size.
     *  {String} [options.marginTop=false] use 'margin-top' or 'top' to elements position
     *  {String} [options.marginLeft=false] use 'margin-left' or 'left' to elements position
     *  {Object} [options.scrollDownBtn] scroll Down Button  for scroll down button possibility
     *  {Number} [options.scrollDownBtnStep=4] step count to full scrollDown

     */
    wellScroller = function ($container, options) {
        if (!$container) {
            console.trace();
            throw new Error('Некорректный аргумент Container');
        }
        if (!$container.hasOwnProperty('WScroller')) {
            $container.WScroller = new Plugin($container, options);
        }
        return $container['WScroller'];
    };
    window.wellScroller = wellScroller;
}(window));
