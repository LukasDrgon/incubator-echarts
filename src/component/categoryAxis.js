/**
 * echarts组件： 类目轴
 *
 * @desc echarts基于Canvas，纯Javascript图表库，提供直观，生动，可交互，可个性化定制的数据统计图表。
 * @author Kener (@Kener-林峰, linzhifeng@baidu.com)
 *
 */
define(function (require) {
    var Base = require('./base');
    
    // 图形依赖
    var TextShape = require('zrender/shape/Text');
    var LineShape = require('zrender/shape/Line');
    var RectangleShape = require('zrender/shape/Rectangle');
    
    var ecConfig = require('../config');
    var zrUtil = require('zrender/tool/util');
    var zrArea = require('zrender/tool/area');
    
    /**
     * 构造函数
     * @param {Object} messageCenter echart消息中心
     * @param {ZRender} zr zrender实例
     * @param {Object} option 类目轴参数
     * @param {Grid} component 组件
     */
    function CategoryAxis(ecTheme, messageCenter, zr, option, component) {
        Base.call(this, ecTheme, zr, option);
        
        this.init(option, component);
    }
    
    CategoryAxis.prototype = {
        type : ecConfig.COMPONENT_TYPE_AXIS_CATEGORY,
        _reformLabel : function () {
            var data = zrUtil.clone(this.option.data);
            var axisFormatter = this.option.axisLabel.formatter;
            var formatter;
            for (var i = 0, l = data.length; i < l; i++) {
                formatter = data[i].formatter || axisFormatter;
                if (formatter) {
                    if (typeof formatter == 'function') {
                        data[i] = formatter(
                            typeof data[i].value != 'undefined'
                                ? data[i].value
                                : data[i]
                        );
                    }
                    else if (typeof formatter == 'string') {
                        data[i] = formatter.replace(
                            '{value}',
                            typeof data[i].value != 'undefined'
                            ? data[i].value
                            : data[i]
                        );
                    }
                }
                else {
                    data[i] = typeof data[i].value ? data[i].value : data[i];
                }
            }
            return data;
        },
        /**
         * 计算标签显示挑选间隔
         */
        _getInterval : function () {
            var interval   = this.option.axisLabel.interval;
            if (interval == 'auto') {
                // 麻烦的自适应计算
                var fontSize = this.option.axisLabel.textStyle.fontSize;
                var font = this.getFont(this.option.axisLabel.textStyle);
                var data = this.option.data;
                var dataLength = this.option.data.length;

                if (this.option.position == 'bottom' || this.option.position == 'top') {
                    // 横向
                    if (dataLength > 3) {
                        var gap = this.getGap();
                        var isEnough = false;
                        var labelSpace;
                        var labelSize;
                        interval = Math.floor(15 / gap);
                        while (!isEnough && interval < dataLength) {
                            interval++;
                            isEnough = true;
                            labelSpace = gap * interval - 10; // 标签左右至少间隔为5px
                            for (var i = Math.floor((dataLength - 1)/ interval) * interval; 
                                 i >= 0; i -= interval
                             ) {
                                if (this.option.axisLabel.rotate !== 0) {
                                    // 有旋转
                                    labelSize = fontSize;
                                }
                                else if (data[i].textStyle) {
                                    labelSize = zrArea.getTextWidth(
                                        this._labelData[i],
                                        this.getFont(
                                            zrUtil.merge(
                                                data[i].textStyle,
                                                this.option.axisLabel.textStyle
                                           )
                                        )
                                    );
                                }
                                else {
                                    labelSize = zrArea.getTextWidth(
                                        this._labelData[i],
                                        font
                                    );
                                }

                                if (labelSpace < labelSize) {
                                    // 放不下，中断循环让interval++
                                    isEnough = false;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        // 少于3个则全部显示
                        interval = 1;
                    }
                }
                else {
                    // 纵向
                    if (dataLength > 3) {
                        var gap = this.getGap();
                        interval = Math.floor(11 / gap);
                        // 标签上下至少间隔为3px
                        while ((gap * interval - 6) < fontSize
                                && interval < dataLength
                        ) {
                            interval++;
                        }
                    }
                    else {
                        // 少于3个则全部显示
                        interval = 1;
                    }
                }
            }
            else {
                // 用户自定义间隔
                interval += 1;
            }

            return interval;
        },
        
        /**
         * 绘制图形
         */
        _buildShape : function () {
            // 标签文字格式化
            this._labelData = this._reformLabel();
            // 标签显示的挑选间隔
            this._interval = this._getInterval();
            
            this.option.splitArea.show && this._buildSplitArea();
            this.option.splitLine.show && this._buildSplitLine();
            this.option.axisLine.show && this._buildAxisLine();
            this.option.axisTick.show && this._buildAxisTick();
            this.option.axisLabel.show && this._buildAxisLabel();

            for (var i = 0, l = this.shapeList.length; i < l; i++) {
                this.zr.addShape(this.shapeList[i]);
            }
        },

        // 轴线
        _buildAxisLine : function () {
            var lineWidth = this.option.axisLine.lineStyle.width;
            var halfLineWidth = lineWidth / 2;
            var axShape = {
                shape : 'line',
                zlevel : this._zlevelBase + 1,
                hoverable : false
            };
            switch (this.option.position) {
                case 'left' :
                    axShape.style = {
                        xStart : this.grid.getX() - halfLineWidth,
                        yStart : this.grid.getYend() + halfLineWidth,
                        xEnd : this.grid.getX() - halfLineWidth,
                        yEnd : this.grid.getY() - halfLineWidth
                    };
                    break;
                case 'right' :
                    axShape.style = {
                        xStart : this.grid.getXend() + halfLineWidth,
                        yStart : this.grid.getYend() + halfLineWidth,
                        xEnd : this.grid.getXend() + halfLineWidth,
                        yEnd : this.grid.getY() - halfLineWidth
                    };
                    break;
                case 'bottom' :
                    axShape.style = {
                        xStart : this.grid.getX() - halfLineWidth,
                        yStart : this.grid.getYend() + halfLineWidth,
                        xEnd : this.grid.getXend() + halfLineWidth,
                        yEnd : this.grid.getYend() + halfLineWidth
                    };
                    break;
                case 'top' :
                    axShape.style = {
                        xStart : this.grid.getX() - halfLineWidth,
                        yStart : this.grid.getY() - halfLineWidth,
                        xEnd : this.grid.getXend() + halfLineWidth,
                        yEnd : this.grid.getY() - halfLineWidth
                    };
                    break;
            }
            if (this.option.name !== '') {
                axShape.style.text = this.option.name;
                axShape.style.textPosition = this.option.nameLocation;
                axShape.style.textFont = this.getFont(this.option.nameTextStyle);
                if (this.option.nameTextStyle.align) {
                    axShape.style.textAlign = this.option.nameTextStyle.align;
                }
                if (this.option.nameTextStyle.baseline) {
                    axShape.style.textBaseline = this.option.nameTextStyle.baseline;
                }
                if (this.option.nameTextStyle.color) {
                    axShape.style.textColor = this.option.nameTextStyle.color;
                }
            }
            axShape.style.strokeColor = this.option.axisLine.lineStyle.color;
            
            axShape.style.lineWidth = lineWidth;
            // 亚像素优化
            if (this.option.position == 'left' || this.option.position == 'right') {
                // 纵向布局，优化x
                axShape.style.xStart 
                    = axShape.style.xEnd 
                    = this.subPixelOptimize(axShape.style.xEnd, lineWidth);
            }
            else {
                // 横向布局，优化y
                axShape.style.yStart 
                    = axShape.style.yEnd 
                    = this.subPixelOptimize(axShape.style.yEnd, lineWidth);
            }
            
            axShape.style.lineType = this.option.axisLine.lineStyle.type;
            
            axShape = new LineShape(axShape);
            this.shapeList.push(axShape);
        },

        // 小标记
        _buildAxisTick : function () {
            var axShape;
            //var data       = this.option.data;
            var dataLength = this.option.data.length;
            var tickOption = this.option.axisTick;
            var length     = tickOption.length;
            var color      = tickOption.lineStyle.color;
            var lineWidth  = tickOption.lineStyle.width;
            var interval   = tickOption.interval == 'auto' 
                             ? this._interval : (tickOption.interval - 0 + 1);
            var onGap      = tickOption.onGap;
            var optGap     = onGap 
                             ? (this.getGap() / 2) 
                             : typeof onGap == 'undefined'
                                   ? (this.option.boundaryGap ? (this.getGap() / 2) : 0)
                                   : 0;
            var startIndex = optGap > 0 ? -interval : 0;                       
            if (this.option.position == 'bottom' || this.option.position == 'top') {
                // 横向
                var yPosition = this.option.position == 'bottom'
                        ? (tickOption.inside ? (this.grid.getYend() - length) : this.grid.getYend())
                        : (tickOption.inside ? this.grid.getY() : (this.grid.getY() - length));
                var x;
                for (var i = startIndex; i < dataLength; i += interval) {
                    // 亚像素优化
                    x = this.subPixelOptimize(
                        this.getCoordByIndex(i) + (i >= 0 ? optGap : 0), lineWidth
                    );
                    axShape = {
                        shape : 'line',
                        zlevel : this._zlevelBase,
                        hoverable : false,
                        style : {
                            xStart : x,
                            yStart : yPosition,
                            xEnd : x,
                            yEnd : yPosition + length,
                            strokeColor : color,
                            lineWidth : lineWidth
                        }
                    };
                    this.shapeList.push(new LineShape(axShape));
                }
            }
            else {
                // 纵向
                var xPosition = this.option.position == 'left'
                        ? (tickOption.inside ? this.grid.getX() : (this.grid.getX() - length))
                        : (tickOption.inside ? (this.grid.getXend() - length) : this.grid.getXend());
                        
                var y;
                for (var i = startIndex; i < dataLength; i += interval) {
                    // 亚像素优化
                    y = this.subPixelOptimize(
                        this.getCoordByIndex(i) - (i >= 0 ? optGap : 0), lineWidth
                    );
                    axShape = {
                        shape : 'line',
                        zlevel : this._zlevelBase,
                        hoverable : false,
                        style : {
                            xStart : xPosition,
                            yStart : y,
                            xEnd : xPosition + length,
                            yEnd : y,
                            strokeColor : color,
                            lineWidth : lineWidth
                        }
                    };
                    this.shapeList.push(new LineShape(axShape));
                }
            }
        },

        // 坐标轴文本
        _buildAxisLabel : function () {
            var axShape;
            var data       = this.option.data;
            var dataLength = this.option.data.length;
            var rotate     = this.option.axisLabel.rotate;
            var margin     = this.option.axisLabel.margin;
            var textStyle  = this.option.axisLabel.textStyle;
            var dataTextStyle;

            if (this.option.position == 'bottom' || this.option.position == 'top') {
                // 横向
                var yPosition;
                var baseLine;
                if (this.option.position == 'bottom') {
                    yPosition = this.grid.getYend() + margin;
                    baseLine = 'top';
                }
                else {
                    yPosition = this.grid.getY() - margin;
                    baseLine = 'bottom';
                }

                for (var i = 0; i < dataLength; i += this._interval) {
                    if (this._labelData[i] === '') {
                        // 空文本优化
                        continue;
                    }
                    dataTextStyle = zrUtil.merge(
                        data[i].textStyle || {},
                        textStyle
                    );
                    axShape = {
                        shape : 'text',
                        zlevel : this._zlevelBase,
                        hoverable : false,
                        style : {
                            x : this.getCoordByIndex(i),
                            y : yPosition,
                            color : dataTextStyle.color,
                            text : this._labelData[i],
                            textFont : this.getFont(dataTextStyle),
                            textAlign : dataTextStyle.align || 'center',
                            textBaseline : dataTextStyle.baseline || baseLine
                        }
                    };
                    if (rotate) {
                        axShape.style.textAlign = rotate > 0
                                                  ? (this.option.position == 'bottom'
                                                    ? 'right' : 'left')
                                                  : (this.option.position == 'bottom'
                                                    ? 'left' : 'right');
                        axShape.rotation = [
                            rotate * Math.PI / 180,
                            axShape.style.x,
                            axShape.style.y
                        ];
                    }
                    this.shapeList.push(new TextShape(axShape));
                }
            }
            else {
                // 纵向
                var xPosition;
                var align;
                if (this.option.position == 'left') {
                    xPosition = this.grid.getX() - margin;
                    align = 'right';
                }
                else {
                    xPosition = this.grid.getXend() + margin;
                    align = 'left';
                }

                for (var i = 0; i < dataLength; i += this._interval) {
                    if (this._labelData[i] === '') {
                        // 空文本优化
                        continue;
                    }
                    dataTextStyle = zrUtil.merge(
                        data[i].textStyle || {},
                        textStyle
                    );
                    axShape = {
                        shape : 'text',
                        zlevel : this._zlevelBase,
                        hoverable : false,
                        style : {
                            x : xPosition,
                            y : this.getCoordByIndex(i),
                            color : dataTextStyle.color,
                            text : this._labelData[i],
                            textFont : this.getFont(dataTextStyle),
                            textAlign : dataTextStyle.align || align,
                            textBaseline : dataTextStyle.baseline 
                                           || (i === 0 && this.option.name !== '')
                                               ? 'bottom'
                                               : (i == (dataLength - 1) 
                                                  && this.option.name !== '')
                                                 ? 'top'
                                                 : 'middle'
                        }
                    };
                    
                    if (rotate) {
                        axShape.rotation = [
                            rotate * Math.PI / 180,
                            axShape.style.x,
                            axShape.style.y
                        ];
                    }
                    this.shapeList.push(new TextShape(axShape));
                }
            }
        },

        _buildSplitLine : function () {
            var axShape;
            //var data       = this.option.data;
            var dataLength  = this.option.data.length;
            var sLineOption = this.option.splitLine;
            var lineType    = sLineOption.lineStyle.type;
            var lineWidth   = sLineOption.lineStyle.width;
            var color       = sLineOption.lineStyle.color;
            color = color instanceof Array ? color : [color];
            var colorLength = color.length;
            
            var onGap      = sLineOption.onGap;
            var optGap     = onGap 
                             ? (this.getGap() / 2) 
                             : typeof onGap == 'undefined'
                                   ? (this.option.boundaryGap ? (this.getGap() / 2) : 0)
                                   : 0;
            dataLength -= (onGap || (typeof onGap == 'undefined' && this.option.boundaryGap)) ? 1 : 0;
            if (this.option.position == 'bottom' || this.option.position == 'top') {
                // 横向
                var sy = this.grid.getY();
                var ey = this.grid.getYend();
                var x;

                for (var i = 0; i < dataLength; i += this._interval) {
                    // 亚像素优化
                    x = this.subPixelOptimize(
                        this.getCoordByIndex(i) + optGap, lineWidth
                    );
                    axShape = {
                        shape : 'line',
                        zlevel : this._zlevelBase,
                        hoverable : false,
                        style : {
                            xStart : x,
                            yStart : sy,
                            xEnd : x,
                            yEnd : ey,
                            strokeColor : color[(i / this._interval) % colorLength],
                            lineType : lineType,
                            lineWidth : lineWidth
                        }
                    };
                    this.shapeList.push(new LineShape(axShape));
                }

            }
            else {
                // 纵向
                var sx = this.grid.getX();
                var ex = this.grid.getXend();
                var y;

                for (var i = 0; i < dataLength; i += this._interval) {
                    // 亚像素优化
                    y = this.subPixelOptimize(
                        this.getCoordByIndex(i) - optGap, lineWidth
                    );
                    axShape = {
                        shape : 'line',
                        zlevel : this._zlevelBase,
                        hoverable : false,
                        style : {
                            xStart : sx,
                            yStart : y,
                            xEnd : ex,
                            yEnd : y,
                            strokeColor : color[(i / this._interval) % colorLength],
                            linetype : lineType,
                            lineWidth : lineWidth
                        }
                    };
                    this.shapeList.push(new LineShape(axShape));
                }
            }
        },

        _buildSplitArea : function () {
            var axShape;
            var sAreaOption = this.option.splitArea;
            var color = sAreaOption.areaStyle.color;
            if (!(color instanceof Array)) {
                // 非数组一律认为是单一颜色的字符串，单一颜色则用一个背景，颜色错误不负责啊！！！
                axShape = {
                    shape : 'rectangle',
                    zlevel : this._zlevelBase,
                    hoverable : false,
                    style : {
                        x : this.grid.getX(),
                        y : this.grid.getY(),
                        width : this.grid.getWidth(),
                        height : this.grid.getHeight(),
                        color : color
                        // type : this.option.splitArea.areaStyle.type,
                    }
                };
                this.shapeList.push(new RectangleShape(axShape));
            }
            else {
                // 多颜色
                var colorLength = color.length;
                var dataLength  = this.option.data.length;
        
                var onGap      = sAreaOption.onGap;
                var optGap     = onGap 
                                 ? (this.getGap() / 2) 
                                 : typeof onGap == 'undefined'
                                       ? (this.option.boundaryGap ? (this.getGap() / 2) : 0)
                                       : 0;
                if (this.option.position == 'bottom' || this.option.position == 'top') {
                    // 横向
                    var y = this.grid.getY();
                    var height = this.grid.getHeight();
                    var lastX = this.grid.getX();
                    var curX;
    
                    for (var i = 0; i <= dataLength; i += this._interval) {
                        curX = i < dataLength
                               ? (this.getCoordByIndex(i) + optGap)
                               : this.grid.getXend();
                        axShape = {
                            shape : 'rectangle',
                            zlevel : this._zlevelBase,
                            hoverable : false,
                            style : {
                                x : lastX,
                                y : y,
                                width : curX - lastX,
                                height : height,
                                color : color[(i / this._interval) % colorLength]
                                // type : this.option.splitArea.areaStyle.type,
                            }
                        };
                        this.shapeList.push(new RectangleShape(axShape));
                        lastX = curX;
                    }
                }
                else {
                    // 纵向
                    var x = this.grid.getX();
                    var width = this.grid.getWidth();
                    var lastYend = this.grid.getYend();
                    var curY;
    
                    for (var i = 0; i <= dataLength; i += this._interval) {
                        curY = i < dataLength
                               ? (this.getCoordByIndex(i) - optGap)
                               : this.grid.getY();
                        axShape = {
                            shape : 'rectangle',
                            zlevel : this._zlevelBase,
                            hoverable : false,
                            style : {
                                x : x,
                                y : curY,
                                width : width,
                                height : lastYend - curY,
                                color : color[(i / this._interval) % colorLength]
                                // type : this.option.splitArea.areaStyle.type
                            }
                        };
                        this.shapeList.push(new RectangleShape(axShape));
                        lastYend = curY;
                    }
                }
            }
        },

        /**
         * 构造函数默认执行的初始化方法，也用于创建实例后动态修改
         * @param {Object} newZr
         * @param {Object} newOption
         * @param {Object} newGrid
         */
        init :function (newOption, newComponent) {
            if (newOption.data.length < 1) {
                return;
            }
            this.grid = (newComponent && newComponent.grid) || this.grid;
            
            this.refresh(newOption);
        },

        /**
         * 刷新
         */
        refresh : function (newOption) {
            if (newOption) {
                this.option = this.reformOption(newOption);
                // 通用字体设置
                this.option.axisLabel.textStyle = zrUtil.merge(
                    this.option.axisLabel.textStyle || {},
                    this.ecTheme.textStyle
                );
                this.option.axisLabel.textStyle = zrUtil.merge(
                    this.option.axisLabel.textStyle || {},
                    this.ecTheme.textStyle
                );
            }
            this.clear();
            this._buildShape();
        },

        /**
         * 返回间隔
         */
        getGap : function () {
            var dataLength = this.option.data.length;
            var total = (this.option.position == 'bottom'
                        || this.option.position == 'top')
                        ? this.grid.getWidth()
                        : this.grid.getHeight();
            if (this.option.boundaryGap) {              // 留空
                return total / dataLength;
            }
            else {                                      // 顶头
                return total / (dataLength > 1 ? (dataLength - 1) : 1);
            }
        },

        // 根据值换算位置
        getCoord : function (value) {
            var data = this.option.data;
            var dataLength = data.length;
            var gap = this.getGap();
            var position = this.option.boundaryGap ? (gap / 2) : 0;

            for (var i = 0; i < dataLength; i++) {
                if (data[i] == value
                    || (typeof data[i].value != 'undefined' 
                        && data[i].value == value)
                ) {
                    if (this.option.position == 'bottom'
                        || this.option.position == 'top'
                    ) {
                        // 横向
                        position = this.grid.getX() + position;
                    }
                    else {
                        // 纵向
                        position = this.grid.getYend() - position;
                    }
                    
                    return position;
                    // Math.floor可能引起一些偏差，但性能会更好
                    /* 准确更重要
                    return (i === 0 || i == dataLength - 1)
                           ? position
                           : Math.floor(position);
                    */
                }
                position += gap;
            }
        },

        // 根据类目轴数据索引换算位置
        getCoordByIndex : function (dataIndex) {
            if (dataIndex < 0) {
                if (this.option.position == 'bottom' || this.option.position == 'top') {
                    return this.grid.getX();
                }
                else {
                    return this.grid.getYend();
                }
            }
            else if (dataIndex > this.option.data.length - 1) {
                if (this.option.position == 'bottom' || this.option.position == 'top') {
                    return this.grid.getXend();
                }
                else {
                    return this.grid.getY();
                }
            }
            else {
                var gap = this.getGap();
                var position = this.option.boundaryGap ? (gap / 2) : 0;
                position += dataIndex * gap;
                
                if (this.option.position == 'bottom'
                    || this.option.position == 'top'
                ) {
                    // 横向
                    position = this.grid.getX() + position;
                }
                else {
                    // 纵向
                    position = this.grid.getYend() - position;
                }
                
                return position;
                /* 准确更重要
                return (dataIndex === 0 || dataIndex == this.option.data.length - 1)
                       ? position
                       : Math.floor(position);
                */
            }
        },

        // 根据类目轴数据索引换算类目轴名称
        getNameByIndex : function (dataIndex) {
            var data = this.option.data[dataIndex];
            if (typeof data != 'undefined' && typeof data.value != 'undefined')
            {
                return data.value;
            }
            else {
                return data;
            }
        },
        
        // 根据类目轴名称换算类目轴数据索引
        getIndexByName : function (name) {
            var data = this.option.data;
            var dataLength = data.length;

            for (var i = 0; i < dataLength; i++) {
                if (data[i] == name
                    || (typeof data[i].value != 'undefined' 
                        && data[i].value == name)
                ) {
                    return i;
                }
            }
        },

        /**
         * 根据类目轴数据索引返回是否为主轴线
         * @param {number} dataIndex 类目轴数据索引
         * @return {boolean} 是否为主轴
         */
        isMainAxis : function (dataIndex) {
            return dataIndex % this._interval === 0;
        },

        getPosition : function () {
            return this.option.position;
        }
    };
    
    zrUtil.inherits(CategoryAxis, Base);
    
    require('../component').define('categoryAxis', CategoryAxis);
    
    return CategoryAxis;
});