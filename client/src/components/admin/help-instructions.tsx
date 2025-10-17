import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Users, User, Star, Settings, FileText, Mail, Image, Upload, Sparkles } from "lucide-react";
import { useUiText } from "@/contexts/ui-text-context";

export default function HelpInstructions() {
  const t = {
    pageTitle: useUiText("admin.help", "page_title"),
    pageDescription: useUiText("admin.help", "page_description"),
    sectionBooksTitle: useUiText("admin.help", "section_books_title"),
    booksHowToAddTitle: useUiText("admin.help", "books_how_to_add_title"),
    booksStep1: useUiText("admin.help", "books_step1"),
    booksStep2: useUiText("admin.help", "books_step2"),
    booksStep2Item1: useUiText("admin.help", "books_step2_item1"),
    booksStep2Item2: useUiText("admin.help", "books_step2_item2"),
    booksStep2Item3: useUiText("admin.help", "books_step2_item3"),
    booksStep2Item4: useUiText("admin.help", "books_step2_item4"),
    booksStep2Item5: useUiText("admin.help", "books_step2_item5"),
    booksStep3: useUiText("admin.help", "books_step3"),
    booksStep4: useUiText("admin.help", "books_step4"),
    booksStep5: useUiText("admin.help", "books_step5"),
    booksStep5Item1: useUiText("admin.help", "books_step5_item1"),
    booksStep5Item2: useUiText("admin.help", "books_step5_item2"),
    booksStep5Item3: useUiText("admin.help", "books_step5_item3"),
    booksStep5Item4: useUiText("admin.help", "books_step5_item4"),
    booksStep5Item5: useUiText("admin.help", "books_step5_item5"),
    booksStep5Item6: useUiText("admin.help", "books_step5_item6"),
    booksStep5Item7: useUiText("admin.help", "books_step5_item7"),
    booksStep5Item8: useUiText("admin.help", "books_step5_item8"),
    booksStep6: useUiText("admin.help", "books_step6"),
    booksQrTitle: useUiText("admin.help", "books_qr_title"),
    booksQrStep1: useUiText("admin.help", "books_qr_step1"),
    booksQrStep2: useUiText("admin.help", "books_qr_step2"),
    booksQrStep3: useUiText("admin.help", "books_qr_step3"),
    booksQrStep4: useUiText("admin.help", "books_qr_step4"),
    booksQrStep5: useUiText("admin.help", "books_qr_step5"),
    booksQrStep6Strong: useUiText("admin.help", "books_qr_step6_strong"),
    booksQrStep6Item1: useUiText("admin.help", "books_qr_step6_item1"),
    booksQrStep6Item2: useUiText("admin.help", "books_qr_step6_item2"),
    booksQrStep6Item3: useUiText("admin.help", "books_qr_step6_item3"),
    booksQrStep6Item4: useUiText("admin.help", "books_qr_step6_item4"),
    booksImageSpecsTitle: useUiText("admin.help", "books_image_specs_title"),
    booksImageSpec1: useUiText("admin.help", "books_image_spec1"),
    booksImageSpec2: useUiText("admin.help", "books_image_spec2"),
    booksImageSpec3: useUiText("admin.help", "books_image_spec3"),
    sectionSeriesTitle: useUiText("admin.help", "section_series_title"),
    seriesHowToCreateTitle: useUiText("admin.help", "series_how_to_create_title"),
    seriesStep1: useUiText("admin.help", "series_step1"),
    seriesStep2: useUiText("admin.help", "series_step2"),
    seriesStep3: useUiText("admin.help", "series_step3"),
    seriesStep4: useUiText("admin.help", "series_step4"),
    seriesStep5: useUiText("admin.help", "series_step5"),
    seriesStep6: useUiText("admin.help", "series_step6"),
    seriesStep7: useUiText("admin.help", "series_step7"),
    seriesBackgroundTitle: useUiText("admin.help", "series_background_title"),
    seriesBackgroundDesc: useUiText("admin.help", "series_background_desc"),
    sectionBioTitle: useUiText("admin.help", "section_bio_title"),
    bioHowToEditTitle: useUiText("admin.help", "bio_how_to_edit_title"),
    bioStep1: useUiText("admin.help", "bio_step1"),
    bioStep2: useUiText("admin.help", "bio_step2"),
    bioStep3: useUiText("admin.help", "bio_step3"),
    bioStep4: useUiText("admin.help", "bio_step4"),
    bioStep5: useUiText("admin.help", "bio_step5"),
    bioTipsTitle: useUiText("admin.help", "bio_tips_title"),
    bioTip1: useUiText("admin.help", "bio_tip1"),
    bioTip2: useUiText("admin.help", "bio_tip2"),
    bioTip3: useUiText("admin.help", "bio_tip3"),
    bioTip4: useUiText("admin.help", "bio_tip4"),
    sectionTestimonialsTitle: useUiText("admin.help", "section_testimonials_title"),
    testimonialsHowToAddTitle: useUiText("admin.help", "testimonials_how_to_add_title"),
    testimonialsStep1: useUiText("admin.help", "testimonials_step1"),
    testimonialsStep2: useUiText("admin.help", "testimonials_step2"),
    testimonialsStep3: useUiText("admin.help", "testimonials_step3"),
    testimonialsStep4: useUiText("admin.help", "testimonials_step4"),
    testimonialsStep5: useUiText("admin.help", "testimonials_step5"),
    testimonialsStep6: useUiText("admin.help", "testimonials_step6"),
    testimonialsStep7: useUiText("admin.help", "testimonials_step7"),
    testimonialsStep8: useUiText("admin.help", "testimonials_step8"),
    testimonialsBestPracticesTitle: useUiText("admin.help", "testimonials_best_practices_title"),
    testimonialsTip1: useUiText("admin.help", "testimonials_tip1"),
    testimonialsTip2: useUiText("admin.help", "testimonials_tip2"),
    testimonialsTip3: useUiText("admin.help", "testimonials_tip3"),
    testimonialsTip4: useUiText("admin.help", "testimonials_tip4"),
    sectionBlogTitle: useUiText("admin.help", "section_blog_title"),
    blogHowToCreateTitle: useUiText("admin.help", "blog_how_to_create_title"),
    blogStep1: useUiText("admin.help", "blog_step1"),
    blogStep2: useUiText("admin.help", "blog_step2"),
    blogStep3: useUiText("admin.help", "blog_step3"),
    blogStep4: useUiText("admin.help", "blog_step4"),
    blogStep5: useUiText("admin.help", "blog_step5"),
    blogStep6: useUiText("admin.help", "blog_step6"),
    blogStep7: useUiText("admin.help", "blog_step7"),
    blogIdeasTitle: useUiText("admin.help", "blog_ideas_title"),
    blogIdea1: useUiText("admin.help", "blog_idea1"),
    blogIdea2: useUiText("admin.help", "blog_idea2"),
    blogIdea3: useUiText("admin.help", "blog_idea3"),
    blogIdea4: useUiText("admin.help", "blog_idea4"),
    blogIdea5: useUiText("admin.help", "blog_idea5"),
    blogIdea6: useUiText("admin.help", "blog_idea6"),
    sectionSettingsTitle: useUiText("admin.help", "section_settings_title"),
    settingsGeneralTitle: useUiText("admin.help", "settings_general_title"),
    settingsGeneralItem1Strong: useUiText("admin.help", "settings_general_item1_strong"),
    settingsGeneralItem1Desc: useUiText("admin.help", "settings_general_item1_desc"),
    settingsGeneralItem2Strong: useUiText("admin.help", "settings_general_item2_strong"),
    settingsGeneralItem2Desc: useUiText("admin.help", "settings_general_item2_desc"),
    settingsGeneralItem3Strong: useUiText("admin.help", "settings_general_item3_strong"),
    settingsGeneralItem3Desc: useUiText("admin.help", "settings_general_item3_desc"),
    settingsGeneralItem4Strong: useUiText("admin.help", "settings_general_item4_strong"),
    settingsGeneralItem4Desc: useUiText("admin.help", "settings_general_item4_desc"),
    settingsNewsletterTitle: useUiText("admin.help", "settings_newsletter_title"),
    settingsNewsletterStep1Strong: useUiText("admin.help", "settings_newsletter_step1_strong"),
    settingsNewsletterStep1Item1: useUiText("admin.help", "settings_newsletter_step1_item1"),
    settingsNewsletterStep1Item2: useUiText("admin.help", "settings_newsletter_step1_item2"),
    settingsNewsletterStep1Item3: useUiText("admin.help", "settings_newsletter_step1_item3"),
    settingsNewsletterStep2Strong: useUiText("admin.help", "settings_newsletter_step2_strong"),
    settingsNewsletterStep2Item1: useUiText("admin.help", "settings_newsletter_step2_item1"),
    settingsNewsletterStep2Item2: useUiText("admin.help", "settings_newsletter_step2_item2"),
    settingsNewsletterStep2Item3: useUiText("admin.help", "settings_newsletter_step2_item3"),
    settingsNewsletterStep3Strong: useUiText("admin.help", "settings_newsletter_step3_strong"),
    settingsNewsletterStep3Item1: useUiText("admin.help", "settings_newsletter_step3_item1"),
    settingsNewsletterStep3Item2: useUiText("admin.help", "settings_newsletter_step3_item2"),
    settingsNewsletterStep3Item3: useUiText("admin.help", "settings_newsletter_step3_item3"),
    settingsApiKeyTitle: useUiText("admin.help", "settings_api_key_title"),
    settingsApiKeyDesc: useUiText("admin.help", "settings_api_key_desc"),
    sectionImagesTitle: useUiText("admin.help", "section_images_title"),
    imagesSystemTitle: useUiText("admin.help", "images_system_title"),
    imagesSystemDesc: useUiText("admin.help", "images_system_desc"),
    imagesSpecsTitle: useUiText("admin.help", "images_specs_title"),
    imagesBookCoversTitle: useUiText("admin.help", "images_book_covers_title"),
    imagesBookCoversSize: useUiText("admin.help", "images_book_covers_size"),
    imagesBookCoversMax: useUiText("admin.help", "images_book_covers_max"),
    imagesHeroTitle: useUiText("admin.help", "images_hero_title"),
    imagesHeroSize: useUiText("admin.help", "images_hero_size"),
    imagesHeroMax: useUiText("admin.help", "images_hero_max"),
    imagesProfileTitle: useUiText("admin.help", "images_profile_title"),
    imagesProfileSize: useUiText("admin.help", "images_profile_size"),
    imagesProfileMax: useUiText("admin.help", "images_profile_max"),
    imagesBlogTitle: useUiText("admin.help", "images_blog_title"),
    imagesBlogSize: useUiText("admin.help", "images_blog_size"),
    imagesBlogMax: useUiText("admin.help", "images_blog_max"),
    imagesTipsTitle: useUiText("admin.help", "images_tips_title"),
    imagesTip1: useUiText("admin.help", "images_tip1"),
    imagesTip2: useUiText("admin.help", "images_tip2"),
    imagesTip3: useUiText("admin.help", "images_tip3"),
    imagesTip4: useUiText("admin.help", "images_tip4"),
    imagesTip5: useUiText("admin.help", "images_tip5"),
    sectionPromotionalTitle: useUiText("admin.help", "section_promotional_title"),
    promotionalWhatTitle: useUiText("admin.help", "promotional_what_title"),
    promotionalWhatDesc: useUiText("admin.help", "promotional_what_desc"),
    promotionalTypesTitle: useUiText("admin.help", "promotional_types_title"),
    promotionalMapTitle: useUiText("admin.help", "promotional_map_title"),
    promotionalMapDesc: useUiText("admin.help", "promotional_map_desc"),
    promotionalTreeTitle: useUiText("admin.help", "promotional_tree_title"),
    promotionalTreeDesc: useUiText("admin.help", "promotional_tree_desc"),
    promotionalPressTitle: useUiText("admin.help", "promotional_press_title"),
    promotionalPressDesc: useUiText("admin.help", "promotional_press_desc"),
    promotionalGraphicsTitle: useUiText("admin.help", "promotional_graphics_title"),
    promotionalGraphicsDesc: useUiText("admin.help", "promotional_graphics_desc"),
    promotionalPlaylistTitle: useUiText("admin.help", "promotional_playlist_title"),
    promotionalPlaylistDesc: useUiText("admin.help", "promotional_playlist_desc"),
    promotionalTrailerTitle: useUiText("admin.help", "promotional_trailer_title"),
    promotionalTrailerDesc: useUiText("admin.help", "promotional_trailer_desc"),
    promotionalHowToTitle: useUiText("admin.help", "promotional_how_to_title"),
    promotionalStep1: useUiText("admin.help", "promotional_step1"),
    promotionalStep2: useUiText("admin.help", "promotional_step2"),
    promotionalStep3: useUiText("admin.help", "promotional_step3"),
    promotionalStep4: useUiText("admin.help", "promotional_step4"),
    promotionalStep4Item1: useUiText("admin.help", "promotional_step4_item1"),
    promotionalStep4Item2: useUiText("admin.help", "promotional_step4_item2"),
    promotionalStep5: useUiText("admin.help", "promotional_step5"),
    promotionalDisplayTitle: useUiText("admin.help", "promotional_display_title"),
    promotionalDisplayDesc: useUiText("admin.help", "promotional_display_desc"),
    promotionalDisplayItem1: useUiText("admin.help", "promotional_display_item1"),
    promotionalDisplayItem2: useUiText("admin.help", "promotional_display_item2"),
    promotionalDisplayItem3: useUiText("admin.help", "promotional_display_item3"),
    promotionalDisplayItem4: useUiText("admin.help", "promotional_display_item4"),
    promotionalBestPracticesTitle: useUiText("admin.help", "promotional_best_practices_title"),
    promotionalTip1: useUiText("admin.help", "promotional_tip1"),
    promotionalTip2: useUiText("admin.help", "promotional_tip2"),
    promotionalTip3: useUiText("admin.help", "promotional_tip3"),
    promotionalTip4: useUiText("admin.help", "promotional_tip4"),
    promotionalTip5: useUiText("admin.help", "promotional_tip5"),
    promotionalTip6: useUiText("admin.help", "promotional_tip6"),
    sectionWorkflowTitle: useUiText("admin.help", "section_workflow_title"),
    workflowInitialTitle: useUiText("admin.help", "workflow_initial_title"),
    workflowInitialStep1: useUiText("admin.help", "workflow_initial_step1"),
    workflowInitialStep2: useUiText("admin.help", "workflow_initial_step2"),
    workflowInitialStep3: useUiText("admin.help", "workflow_initial_step3"),
    workflowInitialStep4: useUiText("admin.help", "workflow_initial_step4"),
    workflowInitialStep5: useUiText("admin.help", "workflow_initial_step5"),
    workflowInitialStep6: useUiText("admin.help", "workflow_initial_step6"),
    workflowInitialStep7: useUiText("admin.help", "workflow_initial_step7"),
    workflowPromoteTitle: useUiText("admin.help", "workflow_promote_title"),
    workflowPromoteStep1: useUiText("admin.help", "workflow_promote_step1"),
    workflowPromoteStep2: useUiText("admin.help", "workflow_promote_step2"),
    workflowPromoteStep3: useUiText("admin.help", "workflow_promote_step3"),
    workflowPromoteStep4: useUiText("admin.help", "workflow_promote_step4"),
    workflowPromoteStep5: useUiText("admin.help", "workflow_promote_step5"),
    workflowPromoteStep6: useUiText("admin.help", "workflow_promote_step6"),
    workflowPromoteStep7: useUiText("admin.help", "workflow_promote_step7"),
    finalTipTitle: useUiText("admin.help", "final_tip_title"),
    finalTipDesc: useUiText("admin.help", "final_tip_desc"),
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg" data-testid="header-help">
        <h2 className="text-3xl font-bold mb-2" data-testid="title-help">{t.pageTitle}</h2>
        <p className="text-primary-foreground/90" data-testid="description-help">
          {t.pageDescription}
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem value="books" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-books">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionBooksTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.booksHowToAddTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.booksStep1}</li>
                <li>{t.booksStep2}
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.booksStep2Item1}</li>
                    <li>{t.booksStep2Item2}</li>
                    <li>{t.booksStep2Item3}</li>
                    <li>{t.booksStep2Item4}</li>
                    <li>{t.booksStep2Item5}</li>
                  </ul>
                </li>
                <li>{t.booksStep3}</li>
                <li>{t.booksStep4}</li>
                <li>{t.booksStep5}
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.booksStep5Item1}</li>
                    <li>{t.booksStep5Item2}</li>
                    <li>{t.booksStep5Item3}</li>
                    <li>{t.booksStep5Item4}</li>
                    <li>{t.booksStep5Item5}</li>
                    <li>{t.booksStep5Item6}</li>
                    <li>{t.booksStep5Item7}</li>
                    <li>{t.booksStep5Item8}</li>
                  </ul>
                </li>
                <li>{t.booksStep6}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.booksQrTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.booksQrStep1}</li>
                <li>{t.booksQrStep2}</li>
                <li>{t.booksQrStep3}</li>
                <li>{t.booksQrStep4}</li>
                <li>{t.booksQrStep5}</li>
                <li><strong>{t.booksQrStep6Strong}</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.booksQrStep6Item1}</li>
                    <li>{t.booksQrStep6Item2}</li>
                    <li>{t.booksQrStep6Item3}</li>
                    <li>{t.booksQrStep6Item4}</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.booksImageSpecsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.booksImageSpec1}</li>
                <li>{t.booksImageSpec2}</li>
                <li>{t.booksImageSpec3}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="series" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-series">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionSeriesTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.seriesHowToCreateTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.seriesStep1}</li>
                <li>{t.seriesStep2}</li>
                <li>{t.seriesStep3}</li>
                <li>{t.seriesStep4}</li>
                <li>{t.seriesStep5}</li>
                <li>{t.seriesStep6}</li>
                <li>{t.seriesStep7}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.seriesBackgroundTitle}</h4>
              <p className="text-muted-foreground">
                {t.seriesBackgroundDesc}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bio" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-bio">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionBioTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.bioHowToEditTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.bioStep1}</li>
                <li>{t.bioStep2}</li>
                <li>{t.bioStep3}</li>
                <li>{t.bioStep4}</li>
                <li>{t.bioStep5}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.bioTipsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.bioTip1}</li>
                <li>{t.bioTip2}</li>
                <li>{t.bioTip3}</li>
                <li>{t.bioTip4}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="testimonials" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-testimonials">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionTestimonialsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.testimonialsHowToAddTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.testimonialsStep1}</li>
                <li>{t.testimonialsStep2}</li>
                <li>{t.testimonialsStep3}</li>
                <li>{t.testimonialsStep4}</li>
                <li>{t.testimonialsStep5}</li>
                <li>{t.testimonialsStep6}</li>
                <li>{t.testimonialsStep7}</li>
                <li>{t.testimonialsStep8}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.testimonialsBestPracticesTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.testimonialsTip1}</li>
                <li>{t.testimonialsTip2}</li>
                <li>{t.testimonialsTip3}</li>
                <li>{t.testimonialsTip4}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="blog" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-blog">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionBlogTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.blogHowToCreateTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.blogStep1}</li>
                <li>{t.blogStep2}</li>
                <li>{t.blogStep3}</li>
                <li>{t.blogStep4}</li>
                <li>{t.blogStep5}</li>
                <li>{t.blogStep6}</li>
                <li>{t.blogStep7}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.blogIdeasTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.blogIdea1}</li>
                <li>{t.blogIdea2}</li>
                <li>{t.blogIdea3}</li>
                <li>{t.blogIdea4}</li>
                <li>{t.blogIdea5}</li>
                <li>{t.blogIdea6}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="settings" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-settings">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionSettingsTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.settingsGeneralTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong>{t.settingsGeneralItem1Strong}</strong> {t.settingsGeneralItem1Desc}</li>
                <li><strong>{t.settingsGeneralItem2Strong}</strong> {t.settingsGeneralItem2Desc}</li>
                <li><strong>{t.settingsGeneralItem3Strong}</strong> {t.settingsGeneralItem3Desc}</li>
                <li><strong>{t.settingsGeneralItem4Strong}</strong> {t.settingsGeneralItem4Desc}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t.settingsNewsletterTitle}
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong>{t.settingsNewsletterStep1Strong}</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.settingsNewsletterStep1Item1}</li>
                    <li>{t.settingsNewsletterStep1Item2}</li>
                    <li>{t.settingsNewsletterStep1Item3}</li>
                  </ul>
                </li>
                <li><strong>{t.settingsNewsletterStep2Strong}</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.settingsNewsletterStep2Item1}</li>
                    <li>{t.settingsNewsletterStep2Item2}</li>
                    <li>{t.settingsNewsletterStep2Item3}</li>
                  </ul>
                </li>
                <li><strong>{t.settingsNewsletterStep3Strong}</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.settingsNewsletterStep3Item1}</li>
                    <li>{t.settingsNewsletterStep3Item2}</li>
                    <li>{t.settingsNewsletterStep3Item3}</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.settingsApiKeyTitle}</h4>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  {t.settingsApiKeyDesc}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="images" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-images">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionImagesTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t.imagesSystemTitle}
              </h4>
              <p className="text-muted-foreground mb-3">
                {t.imagesSystemDesc}
              </p>
              
              <h4 className="font-semibold mb-2">{t.imagesSpecsTitle}</h4>
              <div className="space-y-2 text-muted-foreground">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesBookCoversTitle}</p>
                    <p className="text-sm">{t.imagesBookCoversSize}</p>
                    <p className="text-sm">{t.imagesBookCoversMax}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesHeroTitle}</p>
                    <p className="text-sm">{t.imagesHeroSize}</p>
                    <p className="text-sm">{t.imagesHeroMax}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesProfileTitle}</p>
                    <p className="text-sm">{t.imagesProfileSize}</p>
                    <p className="text-sm">{t.imagesProfileMax}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground">{t.imagesBlogTitle}</p>
                    <p className="text-sm">{t.imagesBlogSize}</p>
                    <p className="text-sm">{t.imagesBlogMax}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.imagesTipsTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.imagesTip1}</li>
                <li>{t.imagesTip2}</li>
                <li>{t.imagesTip3}</li>
                <li>{t.imagesTip4}</li>
                <li>{t.imagesTip5}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="promotional" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-promotional">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionPromotionalTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.promotionalWhatTitle}</h4>
              <p className="text-muted-foreground mb-3">
                {t.promotionalWhatDesc}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalTypesTitle}</h4>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{t.promotionalMapTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalMapDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalTreeTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalTreeDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalPressTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalPressDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalGraphicsTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalGraphicsDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalPlaylistTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalPlaylistDesc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t.promotionalTrailerTitle}</p>
                  <p className="text-sm ml-6">
                    {t.promotionalTrailerDesc}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalHowToTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.promotionalStep1}</li>
                <li>{t.promotionalStep2}</li>
                <li>{t.promotionalStep3}</li>
                <li>{t.promotionalStep4}
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>{t.promotionalStep4Item1}</li>
                    <li>{t.promotionalStep4Item2}</li>
                  </ul>
                </li>
                <li>{t.promotionalStep5}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalDisplayTitle}</h4>
              <p className="text-muted-foreground mb-2">
                {t.promotionalDisplayDesc}
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.promotionalDisplayItem1}</li>
                <li>{t.promotionalDisplayItem2}</li>
                <li>{t.promotionalDisplayItem3}</li>
                <li>{t.promotionalDisplayItem4}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.promotionalBestPracticesTitle}</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.promotionalTip1}</li>
                <li>{t.promotionalTip2}</li>
                <li>{t.promotionalTip3}</li>
                <li>{t.promotionalTip4}</li>
                <li>{t.promotionalTip5}</li>
                <li>{t.promotionalTip6}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="workflow" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline" data-testid="accordion-workflow">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{t.sectionWorkflowTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold mb-2">{t.workflowInitialTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.workflowInitialStep1}</li>
                <li>{t.workflowInitialStep2}</li>
                <li>{t.workflowInitialStep3}</li>
                <li>{t.workflowInitialStep4}</li>
                <li>{t.workflowInitialStep5}</li>
                <li>{t.workflowInitialStep6}</li>
                <li>{t.workflowInitialStep7}</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{t.workflowPromoteTitle}</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>{t.workflowPromoteStep1}</li>
                <li>{t.workflowPromoteStep2}</li>
                <li>{t.workflowPromoteStep3}</li>
                <li>{t.workflowPromoteStep4}</li>
                <li>{t.workflowPromoteStep5}</li>
                <li>{t.workflowPromoteStep6}</li>
                <li>{t.workflowPromoteStep7}</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" data-testid="card-final-tip">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">{t.finalTipTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200" data-testid="content-final-tip">
          <p>
            {t.finalTipDesc}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
