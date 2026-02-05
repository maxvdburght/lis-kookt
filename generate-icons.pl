#!/usr/bin/perl
use strict;
use warnings;
use Compress::Zlib;

# Generate PNG icon files for "Lis kookt" PWA
# Background: #c0392b (red), with white "LK" letters

sub crc32_png {
    my ($data) = @_;
    return Compress::Zlib::crc32($data);
}

sub make_chunk {
    my ($type, $data) = @_;
    my $chunk = $type . $data;
    my $crc = crc32_png($chunk);
    return pack('N', length($data)) . $chunk . pack('N', $crc);
}

sub generate_png {
    my ($size, $filename) = @_;
    
    # Colors
    my @bg = (0xc0, 0x39, 0x2b);    # Red background
    my @fg = (0xff, 0xff, 0xff);     # White text
    my @shadow = (0x8e, 0x1a, 0x0e); # Darker red for subtle depth
    
    # Create pixel data with filter bytes
    my $raw_data = '';
    
    # Define "LK" letter patterns on a 14x9 grid (will be scaled)
    my @letter_pattern = (
        "L.....K...K",
        "L.....K..K.",
        "L.....K.K..",
        "L.....KK...",
        "L.....KK...",
        "L.....K.K..",
        "L.....K..K.",
        "LLLL..K...K",
    );
    
    my $pat_h = scalar @letter_pattern;
    my $pat_w = length($letter_pattern[0]);
    
    # Letter area: centered, taking ~50% of icon
    my $letter_size_w = int($size * 0.55);
    my $letter_size_h = int($size * 0.45);
    my $offset_x = int(($size - $letter_size_w) / 2);
    my $offset_y = int(($size - $letter_size_h) / 2);
    
    # Rounded corner radius
    my $radius = int($size * 0.15);
    
    for my $y (0 .. $size - 1) {
        $raw_data .= chr(0);  # PNG filter: None
        
        for my $x (0 .. $size - 1) {
            # Check if inside rounded rectangle
            my $inside = 1;
            # Check corners
            if ($x < $radius && $y < $radius) {
                # Top-left corner
                my $dx = $radius - $x;
                my $dy = $radius - $y;
                $inside = ($dx*$dx + $dy*$dy <= $radius*$radius) ? 1 : 0;
            } elsif ($x >= $size - $radius && $y < $radius) {
                # Top-right corner
                my $dx = $x - ($size - 1 - $radius);
                my $dy = $radius - $y;
                $inside = ($dx*$dx + $dy*$dy <= $radius*$radius) ? 1 : 0;
            } elsif ($x < $radius && $y >= $size - $radius) {
                # Bottom-left corner
                my $dx = $radius - $x;
                my $dy = $y - ($size - 1 - $radius);
                $inside = ($dx*$dx + $dy*$dy <= $radius*$radius) ? 1 : 0;
            } elsif ($x >= $size - $radius && $y >= $size - $radius) {
                # Bottom-right corner
                my $dx = $x - ($size - 1 - $radius);
                my $dy = $y - ($size - 1 - $radius);
                $inside = ($dx*$dx + $dy*$dy <= $radius*$radius) ? 1 : 0;
            }
            
            if (!$inside) {
                # Transparent outside rounded rect
                $raw_data .= chr(0) . chr(0) . chr(0) . chr(0);
                next;
            }
            
            # Check if this pixel is part of a letter
            my $lx = $x - $offset_x;
            my $ly = $y - $offset_y;
            
            my $is_letter = 0;
            if ($lx >= 0 && $lx < $letter_size_w && $ly >= 0 && $ly < $letter_size_h) {
                my $pat_col = int($lx * $pat_w / $letter_size_w);
                my $pat_row = int($ly * $pat_h / $letter_size_h);
                
                $pat_col = $pat_w - 1 if $pat_col >= $pat_w;
                $pat_row = $pat_h - 1 if $pat_row >= $pat_h;
                
                if (substr($letter_pattern[$pat_row], $pat_col, 1) ne '.') {
                    $is_letter = 1;
                }
            }
            
            if ($is_letter) {
                $raw_data .= chr($fg[0]) . chr($fg[1]) . chr($fg[2]) . chr(255);
            } else {
                $raw_data .= chr($bg[0]) . chr($bg[1]) . chr($bg[2]) . chr(255);
            }
        }
    }
    
    # Compress the image data
    my $compressed = Compress::Zlib::compress($raw_data, 9);
    
    # Build PNG file
    my $png = '';
    
    # PNG Signature
    $png .= pack('C8', 137, 80, 78, 71, 13, 10, 26, 10);
    
    # IHDR chunk
    my $ihdr_data = pack('NNCCCCC', 
        $size,  # width
        $size,  # height
        8,      # bit depth
        6,      # color type (RGBA)
        0,      # compression method
        0,      # filter method
        0       # interlace method
    );
    $png .= make_chunk('IHDR', $ihdr_data);
    
    # IDAT chunk
    $png .= make_chunk('IDAT', $compressed);
    
    # IEND chunk
    $png .= make_chunk('IEND', '');
    
    # Write file
    open(my $fh, '>:raw', $filename) or die "Cannot open $filename: $!";
    print $fh $png;
    close $fh;
    
    my $file_size = length($png);
    print "Created $filename ($size x $size, $file_size bytes)\n";
}

# Generate both sizes
generate_png(192, 'C:/claude/lis-kookt/public/icons/icon-192.png');
generate_png(512, 'C:/claude/lis-kookt/public/icons/icon-512.png');

print "Done! Icons generated successfully.\n";
